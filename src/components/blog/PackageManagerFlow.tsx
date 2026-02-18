"use client";

import { useState } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const TAB_BAR: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "20px",
};

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: "6px",
        border: active ? "1px solid #6cf" : "1px solid #444",
        background: active ? "#1a3a4a" : "transparent",
        color: active ? "#6cf" : "#999",
        cursor: "pointer",
        fontSize: "13px",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

interface StepInfo {
  id: string;
  label: string;
  description: string;
}

const pnpmSteps: StepInfo[] = [
  { id: "registry", label: "Registry", description: "npm 레지스트리에서 패키지 메타데이터와 tarball을 요청한다. pnpm은 lockfile에 이미 해석된 버전이 있으면 네트워크 요청을 스킵한다." },
  { id: "cas", label: "CAS (SHA-512)", description: "Content-Addressable Store에 파일 단위로 SHA-512 해시를 계산해 저장한다. 같은 내용의 파일은 전역에서 단 1카피만 존재한다." },
  { id: "hardlink", label: "Hard Link", description: "store의 파일을 프로젝트의 node_modules/.pnpm/ 가상 스토어로 하드 링크한다. 디스크 공간을 추가로 사용하지 않는다." },
  { id: "pnpm-store", label: "node_modules/.pnpm", description: ".pnpm/ 디렉토리 안에 패키지별 격리된 node_modules가 구성된다. 각 패키지의 의존성은 여기서 symlink로 연결된다." },
  { id: "symlink", label: "Symlink", description: "프로젝트 루트의 node_modules/에는 .pnpm/ 안의 패키지로의 symlink만 존재한다. phantom dependency를 방지한다." },
];

const yarnSteps: StepInfo[] = [
  { id: "registry", label: "Registry", description: "npm 레지스트리에서 패키지 메타데이터를 요청한다. LockfileResolver가 먼저 시도하고, 실패하면 실제 레지스트리로 요청한다." },
  { id: "zip-cache", label: "Zip Cache", description: "패키지를 zip 파일로 압축해 .yarn/cache/에 저장한다. 글로벌 미러 캐시와 로컬 캐시를 이중으로 운영한다." },
  { id: "pnp-map", label: "PnP Map", description: "패키지 이름 → 파일 위치 매핑을 구성한다. 각 패키지가 어떤 의존성에 접근할 수 있는지도 여기서 정의한다." },
  { id: "pnp-cjs", label: ".pnp.cjs", description: "PnP 맵이 직렬화된 파일. Node.js의 require()를 패치해서, node_modules 없이 패키지를 zip에서 직접 로드한다." },
];

function FlowDiagram({ steps, selected, onSelect }: { steps: StepInfo[]; selected: string | null; onSelect: (id: string) => void }) {
  const w = 720;
  const stepW = 110;
  const stepH = 44;
  const gap = (w - steps.length * stepW) / (steps.length + 1);

  return (
    <svg viewBox={`0 0 ${w} 80`} width="100%" style={{ maxWidth: w }}>
      {steps.map((step, i) => {
        const x = gap + i * (stepW + gap);
        const y = 18;
        const isSelected = selected === step.id;
        return (
          <g key={step.id} onClick={() => onSelect(step.id)} style={{ cursor: "pointer" }}>
            <rect
              x={x} y={y} width={stepW} height={stepH} rx={8}
              fill={isSelected ? "#1a3a4a" : "#1a1a1a"}
              stroke={isSelected ? "#6cf" : "#444"}
              strokeWidth={isSelected ? 2 : 1}
            />
            <text x={x + stepW / 2} y={y + stepH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? "#6cf" : "#ccc"} fontSize={11} fontFamily="inherit">
              {step.label}
            </text>
            {i < steps.length - 1 && (
              <line x1={x + stepW + 2} y1={y + stepH / 2} x2={x + stepW + gap - 2} y2={y + stepH / 2} stroke="#555" strokeWidth={1.5} markerEnd="url(#arrow)" />
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8" fill="none" stroke="#555" strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  );
}

export default function PackageManagerFlow() {
  const [tab, setTab] = useState<"pnpm" | "yarn">("pnpm");
  const [selected, setSelected] = useState<string | null>(null);

  const steps = tab === "pnpm" ? pnpmSteps : yarnSteps;
  const selectedStep = steps.find((s) => s.id === selected);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>설치 플로우 비교</div>
      <div style={TAB_BAR}>
        <Tab active={tab === "pnpm"} onClick={() => { setTab("pnpm"); setSelected(null); }}>pnpm</Tab>
        <Tab active={tab === "yarn"} onClick={() => { setTab("yarn"); setSelected(null); }}>Yarn Berry</Tab>
      </div>
      <div style={{ overflowX: "auto" }}>
        <FlowDiagram steps={steps} selected={selected} onSelect={setSelected} />
      </div>
      {selectedStep && (
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "#0a1a2a", borderRadius: "8px", border: "1px solid #1a3a4a", fontSize: "13px", color: "#aac", lineHeight: 1.6 }}>
          <strong style={{ color: "#6cf" }}>{selectedStep.label}</strong>: {selectedStep.description}
        </div>
      )}
    </div>
  );
}
