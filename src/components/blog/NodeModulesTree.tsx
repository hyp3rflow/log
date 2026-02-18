"use client";

import { useState } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

interface TreeNode {
  name: string;
  tooltip: string;
  isSymlink?: boolean;
  symlinkTarget?: string;
  children?: TreeNode[];
}

const pnpmTree: TreeNode[] = [
  {
    name: "node_modules/",
    tooltip: "프로젝트 루트의 node_modules. symlink만 포함한다.",
    children: [
      {
        name: ".pnpm/",
        tooltip: "가상 스토어. 모든 패키지의 실제 파일이 여기에 하드 링크된다.",
        children: [
          {
            name: "express@4.18.2/",
            tooltip: "express 패키지의 격리된 node_modules",
            children: [
              { name: "node_modules/", tooltip: "express와 그 의존성들이 격리된 공간", children: [
                { name: "express/", tooltip: "CAS에서 하드 링크된 실제 파일들" },
                { name: "accepts/", tooltip: "express의 의존성. symlink로 연결", isSymlink: true, symlinkTarget: ".pnpm/accepts@1.3.8/" },
                { name: "body-parser/", tooltip: "express의 의존성. symlink로 연결", isSymlink: true, symlinkTarget: ".pnpm/body-parser@1.20.1/" },
              ] },
            ],
          },
          { name: "lodash@4.17.21/", tooltip: "lodash의 격리된 디렉토리. CAS에서 하드 링크" },
        ],
      },
      { name: "express/", tooltip: ".pnpm/express@4.18.2/node_modules/express 로의 symlink", isSymlink: true, symlinkTarget: ".pnpm/express@4.18.2/" },
      { name: "lodash/", tooltip: ".pnpm/lodash@4.17.21/node_modules/lodash 로의 symlink", isSymlink: true, symlinkTarget: ".pnpm/lodash@4.17.21/" },
    ],
  },
];

const yarnTree: TreeNode[] = [
  { name: ".pnp.cjs", tooltip: "PnP 매니페스트. Node.js의 require()를 패치해서 zip에서 직접 모듈을 로드한다." },
  { name: ".pnp.loader.mjs", tooltip: "ESM 로더. import 문을 위한 PnP 지원을 제공한다." },
  {
    name: ".yarn/",
    tooltip: "Yarn Berry의 모든 캐시와 설정이 여기에 저장된다.",
    children: [
      {
        name: "cache/",
        tooltip: "패키지 zip 캐시. zero-install 시 이 디렉토리를 git에 커밋한다.",
        children: [
          { name: "express-npm-4.18.2-bb15c1aaf1.zip", tooltip: "express 패키지의 zip 아카이브. 런타임에 ZipFS로 직접 읽는다." },
          { name: "lodash-npm-4.17.21-6382451519.zip", tooltip: "lodash 패키지의 zip 아카이브." },
        ],
      },
    ],
  },
];

function TreeView({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  return (
    <div style={{ position: "relative" }}>
      {nodes.map((node, i) => (
        <div key={i}>
          <div
            style={{
              paddingLeft: depth * 20,
              padding: "3px 6px 3px " + (depth * 20 + 6) + "px",
              fontSize: "12px",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              color: node.isSymlink ? "#7c9" : "#ccc",
              cursor: "default",
              borderRadius: "4px",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              setHoveredTooltip(node.tooltip);
              setTooltipPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setHoveredTooltip(null)}
          >
            {node.children ? "📁 " : "📄 "}
            {node.name}
            {node.isSymlink && (
              <span style={{ color: "#666", fontSize: "11px" }}> → {node.symlinkTarget}</span>
            )}
            {hoveredTooltip === node.tooltip && (
              <div
                style={{
                  position: "fixed",
                  left: tooltipPos.x + 12,
                  top: tooltipPos.y - 8,
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "#aab",
                  maxWidth: "300px",
                  lineHeight: 1.5,
                  zIndex: 100,
                  pointerEvents: "none",
                }}
              >
                {node.tooltip}
              </div>
            )}
          </div>
          {node.children && <TreeView nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

export default function NodeModulesTree() {
  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>node_modules 구조 비교</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "#6cf", marginBottom: "8px", fontWeight: 600 }}>pnpm — symlink + hard link</div>
          <div style={{ background: "#0a0a0a", borderRadius: "8px", padding: "12px", border: "1px solid #222", minHeight: "200px" }}>
            <TreeView nodes={pnpmTree} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#c9f", marginBottom: "8px", fontWeight: 600 }}>Yarn Berry — PnP (no node_modules)</div>
          <div style={{ background: "#0a0a0a", borderRadius: "8px", padding: "12px", border: "1px solid #222", minHeight: "200px" }}>
            <TreeView nodes={yarnTree} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "#666", marginTop: "12px" }}>각 항목에 마우스를 올려 설명을 확인할 수 있습니다.</div>
    </div>
  );
}
