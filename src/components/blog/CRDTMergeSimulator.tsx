"use client";

import { useState, useCallback } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
  fontFamily: "monospace",
};

const NODE_BOX: React.CSSProperties = {
  border: "1px solid #444",
  borderRadius: "8px",
  background: "#1a1a1a",
  padding: "16px",
  flex: 1,
  minWidth: "200px",
};

const BTN: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#222",
  color: "#e0e0e0",
  cursor: "pointer",
  fontSize: "13px",
  fontFamily: "inherit",
};

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN,
  background: "#1a3a5c",
  borderColor: "#2a6ab0",
};

const BADGE: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "bold",
};

type Vector = Record<string, number>;

function vectorToString(v: Vector): string {
  const keys = Object.keys(v).sort();
  return `{${keys.map((k) => `${k}: ${v[k]}`).join(", ")}}`;
}

function mergeVectors(a: Vector, b: Vector): Vector {
  const result: Vector = { ...a };
  for (const k of Object.keys(b)) {
    result[k] = Math.max(result[k] ?? 0, b[k]!);
  }
  return result;
}

function sumVector(v: Vector): number {
  return Object.values(v).reduce((a, b) => a + b, 0);
}

interface LogEntry {
  text: string;
  color: string;
}

export default function CRDTMergeSimulator() {
  const [nodeA, setNodeA] = useState<Vector>({ A: 0, B: 0, C: 0 });
  const [nodeB, setNodeB] = useState<Vector>({ A: 0, B: 0, C: 0 });
  const [nodeC, setNodeC] = useState<Vector>({ A: 0, B: 0, C: 0 });
  const [log, setLog] = useState<LogEntry[]>([
    { text: "시뮬레이터 초기화. 3개 노드의 G-Counter.", color: "#888" },
  ]);

  const addLog = useCallback((text: string, color: string) => {
    setLog((prev) => [...prev.slice(-12), { text, color }]);
  }, []);

  const increment = (node: "A" | "B" | "C") => {
    const setters = { A: setNodeA, B: setNodeB, C: setNodeC };
    const getters = { A: nodeA, B: nodeB, C: nodeC };
    const colors = { A: "#4aa8ff", B: "#ff7a5c", C: "#5cdb7a" };
    const newVec = { ...getters[node], [node]: getters[node][node]! + 1 };
    setters[node](newVec);
    addLog(
      `Node ${node}: increment → ${vectorToString(newVec)} (합계: ${sumVector(newVec)})`,
      colors[node],
    );
  };

  const merge = (from: "A" | "B" | "C", to: "A" | "B" | "C") => {
    if (from === to) return;
    const getters = { A: nodeA, B: nodeB, C: nodeC };
    const setters = { A: setNodeA, B: setNodeB, C: setNodeC };
    const merged = mergeVectors(getters[to], getters[from]);
    setters[to](merged);
    addLog(
      `Merge ${from} → ${to}: ${vectorToString(merged)} (합계: ${sumVector(merged)})`,
      "#d4a" as string,
    );
  };

  const reset = () => {
    setNodeA({ A: 0, B: 0, C: 0 });
    setNodeB({ A: 0, B: 0, C: 0 });
    setNodeC({ A: 0, B: 0, C: 0 });
    setLog([{ text: "리셋 완료.", color: "#888" }]);
  };

  const nodes = [
    { id: "A" as const, vec: nodeA, color: "#4aa8ff" },
    { id: "B" as const, vec: nodeB, color: "#ff7a5c" },
    { id: "C" as const, vec: nodeC, color: "#5cdb7a" },
  ];

  const allEqual =
    vectorToString(nodeA) === vectorToString(nodeB) &&
    vectorToString(nodeB) === vectorToString(nodeC);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px" }}>
        <strong style={{ color: "#e0e0e0" }}>G-Counter 머지 시뮬레이터</strong>{" "}
        — 각 노드에서 increment 후 merge하여 수렴 과정을 확인
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        {nodes.map((n) => (
          <div key={n.id} style={NODE_BOX}>
            <div style={{ color: n.color, fontWeight: "bold", marginBottom: "8px", fontSize: "15px" }}>
              Node {n.id}
            </div>
            <div style={{ color: "#ccc", fontSize: "13px", marginBottom: "4px" }}>
              벡터: {vectorToString(n.vec)}
            </div>
            <div style={{ color: "#aaa", fontSize: "13px", marginBottom: "12px" }}>
              합계: <strong style={{ color: "#e0e0e0" }}>{sumVector(n.vec)}</strong>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button style={BTN_PRIMARY} onClick={() => increment(n.id)}>
                +1
              </button>
              {nodes
                .filter((o) => o.id !== n.id)
                .map((o) => (
                  <button
                    key={o.id}
                    style={BTN}
                    onClick={() => merge(o.id, n.id)}
                  >
                    ← {o.id}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
        <span
          style={{
            ...BADGE,
            background: allEqual ? "#1a3a1a" : "#3a2a1a",
            color: allEqual ? "#5cdb7a" : "#ffaa44",
          }}
        >
          {allEqual ? "✓ 수렴됨" : "⟳ 아직 다름"}
        </span>
        <button style={{ ...BTN, marginLeft: "auto" }} onClick={reset}>
          리셋
        </button>
      </div>

      <div
        style={{
          background: "#0a0a0a",
          borderRadius: "6px",
          padding: "12px",
          maxHeight: "200px",
          overflowY: "auto",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
      >
        {log.map((entry, i) => (
          <div key={i} style={{ color: entry.color }}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
