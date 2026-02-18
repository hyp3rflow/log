---
title: "pnpm vs Yarn Berry — 패키지 매니저는 어떻게 패키지를 받는가"
date: 2026/02/18
description: "pnpm과 Yarn Berry의 내부 동작을 소스코드 레벨에서 비교 분석"
tag: llm-study, Node, pnpm, Yarn, PackageManager
author: flow
---

# pnpm vs Yarn Berry — 패키지 매니저는 어떻게 패키지를 받는가

## 1. 서론

프론트엔드/백엔드를 가리지 않고 Node.js 생태계에서 가장 먼저 실행하는 명령어는 `npm install`이다. 패키지 매니저는 프로젝트의 토대를 세우는 도구이면서, 동시에 설치 속도·디스크 사용량·보안·재현성에 직접적인 영향을 미친다.

npm은 오랫동안 표준이었지만 몇 가지 구조적 한계가 있었다:

- **플랫 node_modules**: npm v3부터 호이스팅(hoisting)을 통해 의존성을 평탄화했는데, 이로 인해 **phantom dependency** 문제가 생겼다. `package.json`에 선언하지 않은 패키지를 `require()`할 수 있게 되는 것이다.
- **중복 저장**: 10개 프로젝트에서 같은 버전의 `lodash`를 쓰면 디스크에 10번 복사된다.
- **느린 설치**: 매번 네트워크 요청 → tarball 다운로드 → 압축 해제 → node_modules 작성이라는 전체 파이프라인을 반복한다.

이 한계를 극복하기 위해 **pnpm**과 **Yarn Berry**(Yarn v2+)가 각각 다른 철학으로 등장했다. pnpm은 **Content-Addressable Store + symlink** 전략을, Yarn Berry는 **Plug'n'Play(PnP) + zip 캐시** 전략을 택했다.

이 글에서는 두 패키지 매니저의 내부 동작을 **실제 소스코드**를 읽으며 비교한다. 의존성 해석(Resolution) → 다운로드 & 캐싱(Fetching) → node_modules 구성(Linking) 세 단계로 나눠서 살펴보겠다.

---

## 2. 의존성 해석 (Resolution)

패키지 매니저의 첫 번째 일은 "어떤 패키지의 어떤 버전을 설치할 것인가"를 결정하는 것이다.

### 2.1 pnpm의 Resolution

pnpm의 의존성 해석은 `pkg-manager/resolve-dependencies/` 디렉토리에 핵심 로직이 있다. 진입점은 `resolveDependencyTree.ts`의 `resolveRootDependencies()` 함수다.

> 📁 [`pkg-manager/resolve-dependencies/src/resolveDependencyTree.ts`](https://github.com/pnpm/pnpm/blob/main/pkg-manager/resolve-dependencies/src/resolveDependencyTree.ts)

```ts
export interface ResolvedDirectDependency {
  alias: string
  optional: boolean
  dev: boolean
  resolution: Resolution
  pkgId: PkgResolutionId
  version: string
  name: string
  // ...
}
```

이 함수는 각 워크스페이스(importer)의 `package.json`에서 선언된 의존성을 모아 `resolveRootDependencies()`로 넘긴다. 내부적으로는 `resolveDependencies.ts`의 `resolveDependency()` 함수가 실제 resolution을 수행한다.

> 📁 [`pkg-manager/resolve-dependencies/src/resolveDependencies.ts#L1271`](https://github.com/pnpm/pnpm/blob/main/pkg-manager/resolve-dependencies/src/resolveDependencies.ts)

```ts
async function resolveDependency (
  wantedDependency: WantedDependency,
  ctx: ResolutionContext,
  options: ResolveDependencyOptions
): Promise<ResolveDependencyResult> {
  const currentPkg = options.currentPkg ?? {}

  const currentLockfileContainsTheDep = currentPkg.depPath
    ? Boolean(ctx.currentLockfile.packages?.[currentPkg.depPath])
    : undefined

  // 이미 node_modules에 존재하고 업데이트 요청이 아니면 스킵
  if (!options.update && !options.proceed && (currentPkg.resolution != null) && depIsLinked) {
    return null
  }

  // storeController를 통해 레지스트리에서 패키지 정보를 요청
  pkgResponse = await ctx.storeController.requestPackage(wantedDependency, {
    // ...
    preferredVersions,
    downloadPriority: -options.currentDepth,
    // ...
  })
}
```

핵심 설계 포인트:

1. **lockfile 우선**: 현재 lockfile에 이미 해석된 버전이 있고, node_modules에도 존재하면 네트워크 요청 없이 바로 재사용한다.
2. **깊이 기반 우선순위**: `downloadPriority: -options.currentDepth` — 루트에 가까운 의존성일수록 우선 해석한다.
3. **재귀적 해석**: `resolveDependencies()` → `resolveDependenciesOfDependency()` → `resolveChildren()` 순으로 트리를 재귀 탐색한다.

레지스트리에서 실제 버전을 고르는 로직은 `resolving/npm-resolver/src/pickPackageFromMeta.ts`에 있다:

> 📁 [`resolving/npm-resolver/src/pickPackageFromMeta.ts`](https://github.com/pnpm/pnpm/blob/main/resolving/npm-resolver/src/pickPackageFromMeta.ts)

```ts
export function pickPackageFromMeta (
  pickVersionByVersionRangeFn: PickVersionByVersionRange,
  { preferredVersionSelectors, publishedBy, publishedByExclude }: PickPackageFromMetaOptions,
  spec: RegistryPackageSpec,
  meta: PackageMeta
): PackageInRegistry | null {
  // ...
  switch (spec.type) {
    case 'version':
      version = spec.fetchSpec            // 정확한 버전
      break
    case 'tag':
      version = meta['dist-tags'][spec.fetchSpec]  // latest, next 등
      break
    case 'range':
      version = pickVersionByVersionRangeFn({     // semver 범위 해석
        meta,
        versionRange: spec.fetchSpec,
        preferredVersionSelectors,
        publishedBy,
      })
      break
  }
  return meta.versions[version]
}
```

`version`, `tag`, `range` 세 가지 타입에 따라 분기하는데, `range`의 경우 semver 라이브러리를 사용해 호환 가능한 최신 버전을 선택한다. `preferredVersionSelectors`를 통해 이미 다른 곳에서 설치된 버전을 우선 선택함으로써 **중복을 최소화**한다.

### 2.2 Yarn Berry의 Resolution

Yarn Berry의 resolution은 `Project.resolveEverything()`에서 시작된다. 이 메서드는 Yarn의 전체 의존성 트리를 한 번에 해석한다.

> 📁 [`packages/yarnpkg-core/sources/Project.ts#L773`](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-core/sources/Project.ts)

```ts
async resolveEverything(opts) {
  // 이전 virtual resolution을 초기화
  this.forgetVirtualResolutions();

  // Resolver 체인 구성
  const resolver: Resolver = new MultiResolver([
    new LockfileResolver(realResolver),    // lockfile에서 먼저 찾기
    ...resolverChain,                       // 그 다음 실제 레지스트리
  ]);

  // 모든 워크스페이스의 의존성을 큐에 넣고 해석 시작
  await opts.report.startProgressPromise(Report.progressViaTitle(), async progress => {
    const startPackageResolution = async (locator: Locator) => {
      const originalPkg = await resolver.resolve(locator, resolveOptions);
      // ...
    };
    // ...
  });
}
```

pnpm과의 핵심 차이점:

1. **Resolver Chain 패턴**: Yarn Berry는 `MultiResolver`를 사용해 여러 resolver를 체인으로 연결한다. `LockfileResolver`가 먼저 시도하고, 실패하면 다음 resolver(npm, git, file 등)로 넘어간다. pnpm도 비슷하지만 Yarn은 이 패턴이 더 명시적이다.

2. **Offline resolution**: `resolveEverything`의 주석에 흥미로운 내용이 있다:

```ts
// Note that the resolution process is "offline" until everything has been
// successfully resolved; all the processing is expected to have zero side
// effects until we're ready to set all the variables at once
```

Resolution 과정에서 프로젝트 상태를 변경하지 않고, 모든 해석이 끝난 후에 한 번에 반영한다. 이는 동시에 여러 작업을 할 때 부분적으로 업데이트된 상태 때문에 발생하는 버그를 방지하기 위한 설계다.

3. **`install()` 메서드의 단계**: Yarn Berry는 install을 명확하게 세 단계로 분리한다:

```ts
async install(opts: InstallOptions) {
  // Step 1: Resolution
  await opts.report.startTimerPromise(`Resolution step`, async () => {
    await this.resolveEverything(opts);
  });

  // Step 2: Fetch
  await opts.report.startTimerPromise(`Fetch step`, async () => {
    await this.fetchEverything(opts);
  });

  // Step 3: Link
  await opts.report.startTimerPromise(`Link step`, async () => {
    await this.linkEverything(opts);
  });
}
```

### 2.3 비교

| | pnpm | Yarn Berry |
|---|---|---|
| **Resolution 전략** | 재귀적 트리 탐색 (DFS) | 전체 해석 후 일괄 반영 |
| **Lockfile 활용** | 현재 lockfile + node_modules 존재 여부로 스킵 판단 | `LockfileResolver`를 resolver chain 첫 번째로 배치 |
| **중복 최소화** | `preferredVersionSelectors`로 이미 설치된 버전 우선 | `storedResolutions` Map으로 중앙 관리 |

---

## 3. 패키지 다운로드 & 캐싱

Resolution이 "무엇을 설치할지" 결정하는 단계였다면, Fetching은 "실제로 파일을 받아오는" 단계다. 여기서 두 패키지 매니저의 철학이 가장 극명하게 갈린다.

### 3.1 pnpm의 Content-Addressable Store (CAS)

pnpm은 **파일 단위**로 해시를 계산해서 저장하는 Content-Addressable Store를 사용한다. 핵심 구현은 `store/cafs/`에 있다.

> 📁 [`store/cafs/src/index.ts`](https://github.com/pnpm/pnpm/blob/main/store/cafs/src/index.ts)

```ts
export const HASH_ALGORITHM = 'sha512'

function addBufferToCafs (
  writeBufferToCafs: WriteBufferToCafs,
  buffer: Buffer,
  mode: number
): FileWriteResult {
  // 파일 내용의 SHA-512 해시를 계산
  const digest = crypto.hash(HASH_ALGORITHM, buffer, 'hex')
  const isExecutable = modeIsExecutable(mode)
  const fileDest = contentPathFromHex(isExecutable ? 'exec' : 'nonexec', digest)
  const { checkedAt, filePath } = writeBufferToCafs(
    buffer,
    fileDest,
    isExecutable ? 0o755 : undefined,
    { digest, algorithm: HASH_ALGORITHM }
  )
  return { checkedAt, filePath, digest }
}
```

주석에서도 성능에 대한 자신감이 드러난다:

```ts
// Calculating the integrity of the file is surprisingly fast.
// 30K files are calculated in 1 second.
// Hence, from a performance perspective, there is no win in fetching
// the package index file from the registry.
```

3만 개 파일의 해시를 1초 안에 계산할 수 있으니, 레지스트리의 인덱스 파일을 받아올 필요 없이 로컬에서 직접 계산한다는 것이다.

파일의 실제 저장 경로를 결정하는 로직:

> 📁 [`store/cafs/src/getFilePathInCafs.ts`](https://github.com/pnpm/pnpm/blob/main/store/cafs/src/getFilePathInCafs.ts)

```ts
export function contentPathFromHex (fileType: FileType, hex: string): string {
  const p = path.join('files', hex.slice(0, 2), hex.slice(2))
  switch (fileType) {
    case 'exec':
      return `${p}-exec`
    case 'nonexec':
      return p
  }
}
```

해시의 처음 2글자를 디렉토리명으로 쓰고, 나머지를 파일명으로 쓴다. 이건 Git의 `.git/objects/` 구조와 동일한 패턴이다. 수백만 개 파일이 하나의 디렉토리에 몰리는 것을 방지한다. 실행 파일은 `-exec` 접미사를 붙여 구분한다.

인덱스 파일은 패키지 단위로 관리된다:

```ts
export function getIndexFilePathInCafs (
  storeDir: string,
  integrity: string,
  pkgId: string
): string {
  const { hexDigest } = parseIntegrity(integrity)
  const hex = hexDigest.substring(0, 64)
  // 같은 내용이 다른 패키지명/버전으로 퍼블리시될 수 있으므로
  // 해시 + 패키지 ID를 모두 사용
  return path.join(storeDir,
    `index/${hex.slice(0, 2)}/${hex.slice(2)}-${pkgId.replace(/[\\/:*?"<>|]/g, '+')}.mpk`)
}
```

**왜 이렇게 설계했는가?** 패키지 단위가 아니라 **파일 단위**로 해시를 계산하면, 패키지 버전이 올라가면서 변경되지 않은 파일은 완전히 재사용할 수 있다. `lodash@4.17.20`과 `lodash@4.17.21` 사이에 1개 파일만 바뀌었다면, 나머지 수백 개 파일은 store에서 이미 존재하므로 다운로드도 쓰기도 필요 없다.

스토어 경로 결정 로직도 흥미롭다:

> 📁 [`store/store-path/src/index.ts`](https://github.com/pnpm/pnpm/blob/main/store/store-path/src/index.ts)

```ts
async function storePathRelativeToHome (pkgRoot: string, relStore: string, homedir: string) {
  const storeInHomeDir = path.join(homedir, relStore, STORE_VERSION)
  if (await canLinkToSubdir(tempFile, homedir)) {
    // 프로젝트와 홈 디렉토리가 같은 드라이브면 홈에 저장
    return storeInHomeDir
  }
  // 다른 드라이브면 마운트 포인트에 저장
  let mountpoint = await rootLinkTarget(tempFile)
  return path.join(mountpoint, '.pnpm-store', STORE_VERSION)
}
```

pnpm은 하드 링크를 사용하므로, **같은 파일 시스템** 내에 store가 있어야 한다. 프로젝트가 외장 드라이브에 있다면 그 드라이브의 루트에 `.pnpm-store`를 만든다. 이 "하드 링크 가능 여부"를 실제로 테스트 파일을 만들어 확인하는 것도 실용적인 접근이다.

### 3.2 Yarn Berry의 zip 캐시

Yarn Berry는 패키지를 **zip 파일 단위**로 캐싱한다. 핵심은 `Cache` 클래스다.

> 📁 [`packages/yarnpkg-core/sources/Cache.ts`](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-core/sources/Cache.ts)

```ts
export class Cache {
  // 접근된 캐시 파일 추적 — 나중에 사용하지 않는 파일 정리에 활용
  public readonly markedFiles: Set<PortablePath> = new Set();

  // immutable 모드에서는 캐시 쓰기 금지 (CI용)
  public readonly immutable: boolean;

  getVersionFilename(locator: Locator) {
    return `${structUtils.slugifyLocator(locator)}-${this.cacheKey}.zip` as Filename;
  }

  getChecksumFilename(locator: Locator, checksum: string) {
    const contentChecksum = splitChecksumComponents(checksum).hash;
    const significantChecksum = contentChecksum.slice(0, 10);
    return `${structUtils.slugifyLocator(locator)}-${significantChecksum}.zip` as Filename;
  }
}
```

파일명 결정 방식이 pnpm과 근본적으로 다르다:
- **pnpm**: 파일 내용의 해시 → 같은 내용이면 같은 경로
- **Yarn Berry**: 패키지 이름 + 버전 + 캐시 키 → 패키지 단위로 zip 관리

`fetchEverything()`은 병렬로 패키지를 가져온다:

> 📁 [`packages/yarnpkg-core/sources/Project.ts#L1095`](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-core/sources/Project.ts)

```ts
async fetchEverything({cache, report, fetcher: userFetcher, mode}: InstallOptions) {
  const limit = pLimit(FETCHER_CONCURRENCY);  // 32개 동시 다운로드

  await miscUtils.allSettledSafe(locatorHashes.map(locatorHash => limit(async () => {
    const pkg = this.storedPackages.get(locatorHash);
    let fetchResult;
    try {
      fetchResult = await fetcher.fetch(pkg, fetcherOptions);
    } catch (error) {
      error.message = `${structUtils.prettyLocator(this.configuration, pkg)}: ${error.message}`;
      report.reportExceptionOnce(error);
      firstError = true;
      return;
    }
    // checksum 업데이트
  })));
}
```

`FETCHER_CONCURRENCY`가 32로 하드코딩되어 있다. pnpm은 이 값을 설정 가능하게 두는 반면, Yarn Berry는 고정값을 사용한다.

캐시 검증 로직에서 **mirror** 개념이 나온다:

```ts
get mirrorCwd() {
  if (!this.configuration.get(`enableMirror`))
    return null;
  const mirrorCwd = `${this.configuration.get(`globalFolder`)}/cache` as PortablePath;
  return mirrorCwd !== this.cwd ? mirrorCwd : null;
}
```

Yarn Berry는 **프로젝트 로컬 캐시** (`.yarn/cache/`)와 **글로벌 미러 캐시**를 이중으로 운영한다. 글로벌 미러에서 먼저 찾고, 없으면 레지스트리에서 받아서 둘 다에 저장한다.

이게 바로 **zero-install** 컨셉의 기반이다. `.yarn/cache/`를 git에 커밋하면, 팀원이 `git clone` 후 별도 install 없이 바로 프로젝트를 실행할 수 있다. zip 파일이므로 git 저장소 크기도 (상대적으로) 관리 가능하다.

### 3.3 비교: CAS vs zip 캐시

| | pnpm (CAS) | Yarn Berry (zip) |
|---|---|---|
| **저장 단위** | 파일 | 패키지 (zip) |
| **중복 제거 수준** | 파일 레벨 (버전 간 공유 가능) | 패키지 레벨 |
| **디스크 절약** | 매우 높음 (전역 1카피) | 보통 (미러 + 로컬 2카피 가능) |
| **zero-install** | 불가능 (하드 링크 의존) | 가능 (.yarn/cache/ 커밋) |
| **이식성** | 같은 파일 시스템 필수 | 어디서든 동작 |

---

## 4. node_modules 구조 (또는 대안)

패키지를 받았으면 이제 프로젝트에서 `require()`나 `import`로 사용할 수 있도록 배치해야 한다. 여기서 두 도구의 가장 극적인 차이가 드러난다.

### 4.1 pnpm의 symlink 기반 node_modules

pnpm은 node_modules를 유지하되, **symlink + 하드 링크** 조합으로 구성한다.

실제 symlink 생성 코드:

> 📁 [`fs/symlink-dependency/src/index.ts`](https://github.com/pnpm/pnpm/blob/main/fs/symlink-dependency/src/index.ts)

```ts
export async function symlinkDependency (
  dependencyRealLocation: string,
  destModulesDir: string,
  importAs: string
): Promise<{ reused: boolean, warn?: string }> {
  const link = path.join(destModulesDir, importAs)
  linkLogger.debug({ target: dependencyRealLocation, link })
  return symlinkDir(dependencyRealLocation, link)
}
```

놀라울 정도로 간단하다. `symlinkDir`을 감싼 얇은 래퍼일 뿐이다.

하지만 핵심은 **어디서 어디로** symlink를 거느냐이다. pnpm의 headless install (`pkg-manager/headless/src/index.ts`)에서 전체 구조가 드러난다:

> 📁 [`pkg-manager/headless/src/index.ts`](https://github.com/pnpm/pnpm/blob/main/pkg-manager/headless/src/index.ts)

```ts
import { symlinkDependency } from '@pnpm/symlink-dependency'
import { symlinkAllModules } from '@pnpm/worker'

// 패키지를 store에서 .pnpm/ 가상 스토어로 가져온다
const { importMethod, isBuilt } = await storeController.importPackage(depNode.dir, {
  filesResponse,
  force: depNode.forceImportPackage ?? opts.force,
  // ...
})
```

결과적으로 pnpm의 node_modules는 이런 구조가 된다:

```
node_modules/
├── .pnpm/
│   ├── express@4.18.2/
│   │   └── node_modules/
│   │       ├── express/          ← store에서 하드 링크된 실제 파일
│   │       ├── accepts/          → .pnpm/accepts@1.3.8/node_modules/accepts (symlink)
│   │       └── body-parser/      → .pnpm/body-parser@1.20.1/... (symlink)
│   └── lodash@4.17.21/
│       └── node_modules/
│           └── lodash/           ← store에서 하드 링크된 실제 파일
├── express/                      → .pnpm/express@4.18.2/node_modules/express (symlink)
└── lodash/                       → .pnpm/lodash@4.17.21/node_modules/lodash (symlink)
```

하드 링크를 만드는 코드:

> 📁 [`fs/hard-link-dir/src/index.ts`](https://github.com/pnpm/pnpm/blob/main/fs/hard-link-dir/src/index.ts)

```ts
export function hardLinkDir (src: string, destDirs: string[]): void {
  if (destDirs.length === 0) return
  // 임시 디렉토리에 먼저 링크를 만들고, 원자적으로 rename
  for (const destDir of destDirs) {
    filteredDestDirs.push(destDir)
    tempDestDirs.push(pathTemp(path.dirname(destDir)))
  }
  _hardLinkDir(src, tempDestDirs, true)
  for (let i = 0; i < filteredDestDirs.length; i++) {
    renameOverwrite(tempDestDirs[i], filteredDestDirs[i])
  }
}

function linkOrCopy (srcFile: string, destFile: string): void {
  try {
    gfs.linkSync(srcFile, destFile)
  } catch (err: unknown) {
    // OverlayFS 등에서 EXDEV 대신 ENOENT가 발생할 수 있음
    if (err.code === 'EXDEV' || err.code === 'ENOENT') {
      gfs.copyFileSync(srcFile, destFile)  // 하드 링크 실패 시 복사로 폴백
    } else {
      throw err
    }
  }
}
```

설계 포인트:

1. **원자적 교체**: 임시 디렉토리에 먼저 링크를 만들고 `renameOverwrite`로 교체한다. 설치 중 크래시가 나도 node_modules가 반쯤 깨진 상태가 되지 않는다.
2. **graceful fallback**: 하드 링크가 안 되는 환경(Docker OverlayFS 등)에서는 자동으로 `copyFileSync`로 폴백한다.
3. **호이스팅 없음**: 프로젝트의 `node_modules/express`는 `.pnpm/express@4.18.2/node_modules/express`로의 symlink일 뿐이다. express가 내부적으로 사용하는 `accepts`는 express의 가상 node_modules 안에만 symlink로 존재하므로, 프로젝트 코드에서 직접 `require('accepts')`를 하면 에러가 난다. **Phantom dependency 문제 해결.**

### 4.2 Yarn Berry의 PnP (Plug'n'Play)

Yarn Berry는 아예 **node_modules를 만들지 않는다**. 대신 `.pnp.cjs` 파일을 생성해서 Node.js의 모듈 해석을 런타임에 패치한다.

PnP linker가 패키지 정보를 수집하는 과정:

> 📁 [`packages/plugin-pnp/sources/PnpLinker.ts`](https://github.com/yarnpkg/berry/blob/master/packages/plugin-pnp/sources/PnpLinker.ts)

```ts
export class PnpInstaller implements Installer {
  private readonly packageRegistry: PackageRegistry = new Map();

  async installPackage(pkg: Package, fetchResult: FetchResult, api: InstallPackageExtraApi) {
    const key1 = structUtils.stringifyIdent(pkg);
    const key2 = pkg.reference;

    const packageRawLocation = ppath.resolve(packageFs.getRealPath(), fetchResult.prefixPath);
    const packageLocation = normalizeDirectoryPath(this.opts.project.cwd, packageRawLocation);
    const packageDependencies = new Map<string, string | [string, string] | null>();

    // 패키지의 의존성 맵을 구성
    // → 이 정보가 .pnp.cjs에 serialization됨

    miscUtils.getMapWithDefault(this.packageRegistry, key1).set(key2, {
      packageLocation,
      packageDependencies,
      packagePeers,
      linkType: pkg.linkType,
      discardFromLookup: fetchResult.discardFromLookup ?? false,
    });
  }
}
```

이 `packageRegistry`가 최종적으로 `.pnp.cjs`에 직렬화된다.

`.pnp.cjs`가 런타임에 어떻게 작동하는지는 `makeApi.ts`의 `resolveToUnqualified()` 함수에 있다:

> 📁 [`packages/yarnpkg-pnp/sources/loader/makeApi.ts#L551`](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-pnp/sources/loader/makeApi.ts)

```ts
function resolveToUnqualified(
  request: PortablePath,
  issuer: PortablePath | null,
  {considerBuiltins = true}: ResolveToUnqualifiedOptions = {}
): PortablePath | null {
  // 'pnpapi'는 PnP 파일 자체를 반환하는 예약어
  if (request === `pnpapi`)
    return npath.toPortablePath(opts.pnpapiResolution);

  // 빌트인 모듈은 null 반환 (Node.js가 처리)
  if (considerBuiltins && isBuiltin(request))
    return null;

  // 패키지 이름 파싱
  const [, dependencyName, subPath] = dependencyNameMatch;

  // 요청자(issuer)가 어느 패키지인지 찾기
  const issuerLocator = findPackageLocator(issuer);

  // 요청자의 의존성 맵에서 대상 패키지 찾기
  const issuerInformation = getPackageInformationSafe(issuerLocator);
  let dependencyReference = issuerInformation.packageDependencies.get(dependencyName);

  // 없으면 fallback 처리 (호환성)
  if (dependencyReference == null) {
    // fallbackLocators에서 찾기...
  }

  // 찾은 패키지의 실제 위치 반환
  const dependencyLocator = {name: dependencyName, reference: dependencyReference};
  const dependencyInformation = getPackageInformationSafe(dependencyLocator);
  return ppath.resolve(dependencyInformation.packageLocation, subPath);
}
```

이 함수가 PnP의 핵심이다. Node.js의 `require()` 흐름을 다시 정리하면:

1. `require('lodash')`가 호출됨
2. `.pnp.cjs`가 Node.js의 모듈 해석을 패치하여 `resolveToUnqualified()` 호출
3. "현재 파일이 어느 패키지에 속하는가" → `findPackageLocator(issuer)`
4. "그 패키지의 의존성 중 lodash가 있는가" → `packageDependencies.get('lodash')`
5. "lodash의 실제 파일 위치는" → `packageLocation` (보통 `.yarn/cache/` 안의 zip에서 읽음)

**선언하지 않은 의존성에 접근하면?** `packageDependencies`에 없으므로 4번에서 `null`이 반환되고, `MISSING_PEER_DEPENDENCY` 또는 `UNDECLARED_DEPENDENCY` 에러가 발생한다. pnpm과 같은 결과이지만, 달성 방식이 완전히 다르다.

### 4.3 비교: symlink vs PnP

| | pnpm (symlink) | Yarn Berry (PnP) |
|---|---|---|
| **node_modules 존재** | O (하지만 symlink로 구성) | X |
| **phantom dependency 방지** | symlink 구조로 격리 | packageDependencies 맵으로 격리 |
| **런타임 패치** | 불필요 (표준 Node.js 해석) | `.pnp.cjs`가 require를 패치 |
| **zip에서 직접 읽기** | X (하드 링크된 실제 파일) | O (ZipFS로 zip 내부 직접 읽기) |
| **설치 속도** | 하드 링크 (거의 즉시) | zip 쓰기 |
| **호환성** | 대부분 호환 | 일부 패키지에서 이슈 가능 |

---

## 5. 성능 비교

### 설치 속도

pnpm의 가장 큰 무기는 **하드 링크**다. store에 이미 존재하는 파일은 링크만 생성하면 되므로, 두 번째 설치부터는 사실상 파일 복사가 일어나지 않는다. `linkOrCopy()`에서 보듯 `fs.linkSync()` 한 줄이 전부다.

Yarn Berry의 zip 캐시는 첫 설치 시에는 npm tarball → zip 변환 비용이 있지만, zero-install 환경에서는 이미 zip이 있으므로 fetch 단계를 통째로 스킵한다.

**Cold install** (캐시 없음): pnpm ≈ Yarn Berry (둘 다 네트워크 바운드)
**Warm install** (캐시 있음): pnpm이 빠름 (하드 링크 vs zip 압축 해제)
**Zero-install** (Yarn only): Yarn Berry 승 (fetch 단계 자체가 없음)

### 디스크 사용량

pnpm은 파일 단위 CAS이므로, N개 프로젝트에서 같은 패키지를 쓰더라도 디스크에 파일이 1카피만 존재한다. 하드 링크는 디스크 공간을 소비하지 않는다.

Yarn Berry는 프로젝트별 `.yarn/cache/`에 zip이 있고, 선택적으로 글로벌 미러 캐시도 있다. zero-install을 쓰면 git 저장소 크기가 늘어나는 트레이드오프가 있다.

**결론**: 여러 프로젝트를 관리하는 개발자에게는 pnpm의 CAS가 디스크 절약 면에서 압도적이다.

### CI 환경

CI에서는 매번 클린 환경에서 시작하므로:
- **pnpm**: 글로벌 store를 CI 캐시로 유지하면 하드 링크의 이점을 누릴 수 있다.
- **Yarn Berry**: `.yarn/cache/`를 git에 커밋해두면 CI에서 install 자체가 불필요하다 (zero-install). 네트워크 의존성이 완전히 제거되므로 **레지스트리 장애에 영향받지 않는다**.

---

## 6. 실전 차이점

### 호환성

pnpm은 symlink 기반이라 대부분의 Node.js 패키지와 호환된다. `fs.realpathSync()` 호출 시 symlink가 resolve되는 것만 주의하면 된다.

Yarn Berry PnP는 `require()`를 패치하므로, 내부적으로 `fs.existsSync('node_modules/...')`처럼 node_modules의 존재를 가정하는 패키지에서 문제가 생길 수 있다. 이를 위해 Yarn Berry는 `packageExtensions`와 `pnpMode: loose` 옵션을 제공한다. 또한 `nodeLinker: node-modules` 옵션으로 전통적인 node_modules 모드로 폴백할 수도 있다.

### Monorepo: workspace 프로토콜

두 도구 모두 `workspace:*` 프로토콜을 지원한다:

```json
{
  "dependencies": {
    "@my-org/shared": "workspace:*"
  }
}
```

pnpm은 workspace 패키지를 symlink로 연결한다. Yarn Berry는 PnP 맵에 workspace 패키지의 위치를 직접 등록한다. publish 시에는 둘 다 `workspace:*`를 실제 버전으로 치환한다.

### Lockfile 포맷

- **pnpm**: `pnpm-lock.yaml` — YAML 포맷. 패키지의 integrity hash, resolution URL, 의존성 트리를 기록한다.
- **Yarn Berry**: `yarn.lock` — Yarn 고유 포맷(YAML-like). 각 descriptor에 대해 resolved locator와 checksum을 기록한다.

두 lockfile 모두 deterministic하지만, pnpm의 lockfile이 좀 더 읽기 쉬운 편이다 (표준 YAML이므로).

---

## 7. 결론

### 언제 pnpm을 쓸까

- **여러 프로젝트**를 동시에 관리할 때: CAS 덕분에 디스크를 극적으로 절약한다
- **호환성이 중요할 때**: symlink 기반이라 대부분의 도구와 잘 작동한다
- **monorepo**: workspace 기능이 성숙하고, `--filter` 등 편의 기능이 풍부하다
- **기존 npm 프로젝트 마이그레이션**: `pnpm import`로 npm lockfile을 변환할 수 있다

### 언제 Yarn Berry를 쓸까

- **zero-install**이 필요할 때: CI 시간 단축, 레지스트리 장애 대비
- **엄격한 의존성 관리**가 필요할 때: PnP가 phantom dependency를 가장 확실하게 차단한다
- **plugin 시스템**: Yarn Berry의 plugin 아키텍처는 커스터마이징이 필요한 대규모 조직에 유용하다

### 개인적 의견

나는 pnpm 유저다. 가장 큰 이유는 **호환성**과 **단순함**이다. symlink + 하드 링크는 파일 시스템의 기본 기능이므로 Node.js 런타임을 패치할 필요가 없고, 대부분의 도구가 별도 설정 없이 작동한다. CAS의 디스크 절약 효과도 체감이 크다.

Yarn Berry의 PnP는 기술적으로 더 대담한 접근이고, zero-install 컨셉은 매력적이다. 하지만 호환성 이슈로 `packageExtensions`를 관리해야 하는 비용이 있고, `.pnp.cjs`가 에러를 던질 때 디버깅이 직관적이지 않은 경우가 있다.

두 도구 모두 npm의 근본적 한계를 해결했다. 어떤 것을 선택하든, `npm install`의 평탄한 node_modules 시대보다는 훨씬 나은 선택이다.
