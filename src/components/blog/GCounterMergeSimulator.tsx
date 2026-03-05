"use client";

import { useState } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const NODE_BOX: React.CSSProperties = {
  border: "1px solid #444",
  borderRadius: "8px",
  background: "#1a1a1a",
  padding: "16px",
  flex: 1,
  minWidth: "140px",
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

const MERGE_BTN: React.CSSProperties = {
  ...BTN,
  background: "#1a3a2a",
  border: "1px solid #2a6a3a",
  marginTop: "12px",
};

const LABEL: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  marginBottom: "4px",
  display: "block",
};

const VALUE: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#e0e0e0",
  fontVariantNumeric: "tabular-nums",
};

const VECTOR: React.CSSProperties = {
  fontSize: "13px",
  color: "#999",
  fontFamily: "monospace",
  marginTop: "4px",
};

type Vector = [number, number, number];

function mergeVectors(a: Vector, b: Vector): Vector {
  return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])];
}

function sum(v: Vector): number {
  return v[0] + v[1] + v[2];
}

const NAMES = ["A", "B", "C"];

export default function GCounterMergeSimulator() {
  const [vectors, setVectors] = useState<[Vector, Vector, Vector]>([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);

  const increment = (node: number) => {
    setVectors((prev) => {
      const next = prev.map((v) => [...v] as Vector) as [Vector, Vector, Vector];
      next[node][node] += 1;
      return next;
    });
  };

  const merge = () => {
    setVectors((prev) => {
      const merged = prev.reduce(mergeVectors);
      return [merged, [...merged] as Vector, [...merged] as Vector];
    });
  };

  const reset = () => setVectors([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#ccc", marginBottom: "16px" }}>
        G-Counter Merge Simulator
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {vectors.map((vec, i) => (
          <div key={i} style={NODE_BOX}>
            <span style={LABEL}>Node {NAMES[i]}</span>
            <div style={VALUE}>{sum(vec)}</div>
            <div style={VECTOR}>[{vec.join(", ")}]</div>
            <button style={{ ...BTN, marginTop: "10px" }} onClick={() => increment(i)}>
              +1
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button style={MERGE_BTN} onClick={merge}>Merge All</button>
        <button style={{ ...BTN, marginTop: "0" }} onClick={reset}>Reset</button>
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "12px" }}>
        각 노드는 자신의 슬롯만 increment합니다. Merge는 각 슬롯의 max를 취합니다.
      </div>
    </div>
  );
}
