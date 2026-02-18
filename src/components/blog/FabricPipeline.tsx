"use client";

import { useState, useEffect, useRef } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

interface PipelineStep {
  label: string;
  sublabel: string;
  color: string;
}

const steps: PipelineStep[] = [
  { label: "JS Component", sublabel: "React render()", color: "#f9c74f" },
  { label: "Shadow Tree", sublabel: "C++ ShadowNode", color: "#577590" },
  { label: "Yoga Layout", sublabel: "Flexbox → coords", color: "#90be6d" },
  { label: "Diff", sublabel: "Tree comparison", color: "#f94144" },
  { label: "Native View", sublabel: "Mount mutations", color: "#43aa8b" },
];

interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  changed?: boolean;
}

const oldTree: TreeNode[] = [
  { id: "root", label: "View", x: 140, y: 10 },
  { id: "text", label: "Text", x: 80, y: 50 },
  { id: "img", label: "Image", x: 200, y: 50 },
  { id: "btn", label: "Button", x: 140, y: 90 },
];

const newTree: TreeNode[] = [
  { id: "root", label: "View", x: 140, y: 10 },
  { id: "text", label: "Text*", x: 80, y: 50, changed: true },
  { id: "img", label: "Image", x: 200, y: 50 },
  { id: "btn", label: "Button", x: 140, y: 90 },
  { id: "input", label: "Input+", x: 260, y: 90, changed: true },
];

const edges = [
  ["root", "text"],
  ["root", "img"],
  ["root", "btn"],
];

const newEdges = [
  ["root", "text"],
  ["root", "img"],
  ["root", "btn"],
  ["img", "input"],
];

function getNode(tree: TreeNode[], id: string) {
  return tree.find((n) => n.id === id);
}

export default function FabricPipeline() {
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAnimation = () => {
    setActiveStep(-1);
    setRunning(true);
    let i = 0;
    const next = () => {
      setActiveStep(i);
      i++;
      if (i < steps.length) {
        timerRef.current = setTimeout(next, 700);
      } else {
        timerRef.current = setTimeout(() => setRunning(false), 500);
      }
    };
    next();
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const totalW = 700;
  const stepW = 120;
  const gap = (totalW - steps.length * stepW) / (steps.length + 1);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Fabric 렌더링 파이프라인</div>

      <button
        onClick={runAnimation}
        disabled={running}
        style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid #444", background: running ? "#1a1a1a" : "transparent", color: running ? "#555" : "#ccc", cursor: running ? "default" : "pointer", fontSize: "13px", fontFamily: "inherit", marginBottom: "16px" }}
      >
        {running ? "실행 중..." : "▶ 파이프라인 실행"}
      </button>

      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${totalW} 70`} width="100%" style={{ maxWidth: totalW }}>
          <defs>
            <marker id="fab-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7" fill="none" stroke="#555" strokeWidth="1.5" />
            </marker>
          </defs>
          {steps.map((step, i) => {
            const x = gap + i * (stepW + gap);
            const isActive = i <= activeStep;
            return (
              <g key={i}>
                <rect
                  x={x} y={8} width={stepW} height={48} rx={8}
                  fill={isActive ? step.color + "22" : "#1a1a1a"}
                  stroke={isActive ? step.color : "#333"}
                  strokeWidth={isActive ? 2 : 1}
                  style={{ transition: "all 0.3s" }}
                />
                <text x={x + stepW / 2} y={28} textAnchor="middle" fill={isActive ? step.color : "#888"} fontSize={11} fontWeight={600} fontFamily="inherit">{step.label}</text>
                <text x={x + stepW / 2} y={44} textAnchor="middle" fill="#555" fontSize={9} fontFamily="inherit">{step.sublabel}</text>
                {i < steps.length - 1 && (
                  <line x1={x + stepW + 2} y1={32} x2={x + stepW + gap - 2} y2={32} stroke={i < activeStep ? "#666" : "#333"} strokeWidth={1.5} markerEnd="url(#fab-arrow)" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Diff visualization */}
      {activeStep >= 3 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "12px", color: "#f94144", marginBottom: "8px" }}>Diff: 이전 트리 vs 새 트리</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[{ title: "이전 트리", tree: oldTree, edgeList: edges }, { title: "새 트리", tree: newTree, edgeList: newEdges }].map(({ title, tree, edgeList }) => (
              <div key={title}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>{title}</div>
                <svg viewBox="0 0 320 130" width="100%" style={{ maxWidth: 320 }}>
                  {edgeList.map(([from, to], i) => {
                    const f = getNode(tree, from);
                    const t = getNode(tree, to);
                    if (!f || !t) return null;
                    return <line key={i} x1={f.x + 30} y1={f.y + 16} x2={t.x + 30} y2={t.y} stroke="#444" strokeWidth={1} />;
                  })}
                  {tree.map((node) => (
                    <g key={node.id}>
                      <rect
                        x={node.x} y={node.y} width={60} height={28} rx={4}
                        fill={node.changed ? "#2a1a1a" : "#1a1a1a"}
                        stroke={node.changed ? "#f94144" : "#333"}
                        strokeWidth={node.changed ? 2 : 1}
                      />
                      <text x={node.x + 30} y={node.y + 18} textAnchor="middle" fill={node.changed ? "#f94144" : "#aaa"} fontSize={10} fontFamily="inherit">{node.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>빨간 테두리 = 변경/추가된 노드. Fabric은 이 diff 결과만 네이티브에 적용한다.</div>
        </div>
      )}
    </div>
  );
}
