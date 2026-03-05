"use client";

import { useState, useMemo } from "react";

const C = {
  bg: "#111",
  grid: "#1a1a1a",
  gridLine: "#333",
  filled: "#6eb5ff",
  partial: "#3a6a9f",
  empty: "#1a1a1a",
  outline: "#f9c74f",
  text: "#ccc",
  label: "#888",
};

// Simple glyph outlines as closed polygons (normalized 0-1)
const GLYPHS: Record<string, { x: number; y: number }[][]> = {
  A: [
    // outer
    [
      { x: 0.5, y: 0.05 },
      { x: 0.15, y: 0.95 },
      { x: 0.3, y: 0.95 },
      { x: 0.38, y: 0.7 },
      { x: 0.62, y: 0.7 },
      { x: 0.7, y: 0.95 },
      { x: 0.85, y: 0.95 },
    ],
    // inner (counter)
    [
      { x: 0.5, y: 0.25 },
      { x: 0.58, y: 0.58 },
      { x: 0.42, y: 0.58 },
    ],
  ],
  O: [
    // approximate ellipse outer
    (() => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        pts.push({ x: 0.5 + 0.4 * Math.cos(a), y: 0.5 + 0.45 * Math.sin(a) });
      }
      return pts;
    })(),
    // inner
    (() => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        pts.push({ x: 0.5 + 0.25 * Math.cos(a), y: 0.5 + 0.3 * Math.sin(a) });
      }
      return pts;
    })(),
  ],
};

function windingNumber(px: number, py: number, polygon: { x: number; y: number }[]): number {
  let wn = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];
    if (p1.y <= py) {
      if (p2.y > py) {
        const cross = (p2.x - p1.x) * (py - p1.y) - (px - p1.x) * (p2.y - p1.y);
        if (cross > 0) wn++;
      }
    } else {
      if (p2.y <= py) {
        const cross = (p2.x - p1.x) * (py - p1.y) - (px - p1.x) * (p2.y - p1.y);
        if (cross < 0) wn--;
      }
    }
  }
  return wn;
}

function computeCoverage(
  gx: number, gy: number, cellSize: number, contours: { x: number; y: number }[][],
  rule: "non-zero" | "even-odd", samples: number
): number {
  let inside = 0;
  const total = samples * samples;
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = (gx + (sx + 0.5) / samples) * cellSize;
      const py = (gy + (sy + 0.5) / samples) * cellSize;
      // normalize to 0-1
      const nx = px / (cellSize * 16);
      const ny = py / (cellSize * 16);
      let totalWn = 0;
      for (const contour of contours) {
        totalWn += windingNumber(nx, ny, contour);
      }
      const isInside = rule === "non-zero" ? totalWn !== 0 : totalWn % 2 !== 0;
      if (isInside) inside++;
    }
  }
  return inside / total;
}

export default function RasterizationSimulator() {
  const [glyph, setGlyph] = useState<"A" | "O">("A");
  const [rule, setRule] = useState<"non-zero" | "even-odd">("non-zero");
  const [showAA, setShowAA] = useState(true);
  const gridSize = 16;
  const cellPx = 22;
  const samples = showAA ? 4 : 1;

  const contours = GLYPHS[glyph];

  const coverage = useMemo(() => {
    const grid: number[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push(computeCoverage(x, y, 1, contours, rule, samples));
      }
      grid.push(row);
    }
    return grid;
  }, [glyph, rule, samples, contours]);

  const svgSize = gridSize * cellPx;

  // outline path
  const outlinePaths = contours.map((contour) => {
    const pts = contour.map((p) => `${p.x * svgSize},${p.y * svgSize}`);
    return "M" + pts.join(" L") + " Z";
  }).join(" ");

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: 16, margin: "1.5rem 0" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: C.text, fontSize: 13, fontFamily: "system-ui" }}>글리프:</span>
        {(["A", "O"] as const).map((g) => (
          <button key={g} onClick={() => setGlyph(g)} style={{
            background: glyph === g ? "#333" : "#1a1a1a",
            color: glyph === g ? "#fff" : "#888",
            border: `1px solid ${glyph === g ? "#555" : "#333"}`,
            borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 13, fontFamily: "system-ui",
          }}>{g}</button>
        ))}
        <span style={{ color: C.text, fontSize: 13, fontFamily: "system-ui", marginLeft: 8 }}>규칙:</span>
        {(["non-zero", "even-odd"] as const).map((r) => (
          <button key={r} onClick={() => setRule(r)} style={{
            background: rule === r ? "#333" : "#1a1a1a",
            color: rule === r ? "#fff" : "#888",
            border: `1px solid ${rule === r ? "#555" : "#333"}`,
            borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 13, fontFamily: "system-ui",
          }}>{r}</button>
        ))}
        <label style={{ color: C.text, fontSize: 13, fontFamily: "system-ui", marginLeft: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={showAA} onChange={(e) => setShowAA(e.target.checked)} />
          AA (4×4 샘플링)
        </label>
      </div>
      <svg viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ width: "100%", maxWidth: 400, background: C.grid, borderRadius: 6 }}>
        {/* cells */}
        {coverage.map((row, y) =>
          row.map((cov, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * cellPx}
              y={y * cellPx}
              width={cellPx}
              height={cellPx}
              fill={cov > 0 ? C.filled : C.empty}
              opacity={cov > 0 ? (showAA ? 0.15 + cov * 0.85 : 1) : 1}
              stroke={C.gridLine}
              strokeWidth={0.5}
            />
          ))
        )}
        {/* outline */}
        <path d={outlinePaths} fill="none" stroke={C.outline} strokeWidth={1.5} fillRule={rule === "even-odd" ? "evenodd" : "nonzero"} />
      </svg>
      <div style={{ color: C.label, fontSize: 12, marginTop: 8, fontFamily: "system-ui" }}>
        16×16 그리드에서 래스터화 시뮬레이션. 노란 선 = 벡터 아웃라인, 파란 셀 = 커버리지 (밝을수록 높음)
      </div>
    </div>
  );
}
