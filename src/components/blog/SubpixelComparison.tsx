"use client";

import { useState, useMemo } from "react";

const C = {
  bg: "#111",
  grid: "#1a1a1a",
  gridLine: "#222",
  text: "#ccc",
  label: "#888",
};

// Simple bitmap glyph "e" (8x10)
const GLYPH_BITMAP = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0.3, 0.8, 0.9, 0.4, 0, 0],
  [0, 0.4, 0.9, 0.2, 0.1, 0.9, 0.3, 0],
  [0, 0.7, 1.0, 1.0, 1.0, 1.0, 0.6, 0],
  [0, 0.8, 0.9, 0, 0, 0, 0, 0],
  [0, 0.5, 0.9, 0.1, 0.0, 0.7, 0.3, 0],
  [0, 0, 0.4, 0.8, 0.9, 0.5, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function grayscaleToSubpixel(left: number, center: number, right: number): [number, number, number] {
  // Simplified LCD filter (approximating FreeType's default filter)
  const r = 0.1 * left + 0.7 * center + 0.2 * right;
  const g = 0.0 * left + 0.8 * center + 0.2 * right;
  const b = 0.2 * left + 0.7 * center + 0.1 * right;
  return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
}

export default function SubpixelComparison() {
  const [zoom, setZoom] = useState(true);
  const cellPx = zoom ? 28 : 10;
  const cols = GLYPH_BITMAP[0].length;
  const rows = GLYPH_BITMAP.length;

  const subpixelData = useMemo(() => {
    return GLYPH_BITMAP.map((row) =>
      row.map((val, x) => {
        const left = x > 0 ? row[x - 1] : 0;
        const right = x < row.length - 1 ? row[x + 1] : 0;
        return grayscaleToSubpixel(left, val, right);
      })
    );
  }, []);

  const w = cols * cellPx;
  const h = rows * cellPx;
  const totalW = w * 2 + 40;

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: 16, margin: "1.5rem 0" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <span style={{ color: C.text, fontSize: 14, fontFamily: "system-ui" }}>확대:</span>
        <button onClick={() => setZoom(!zoom)} style={{
          background: zoom ? "#333" : "#1a1a1a",
          color: zoom ? "#fff" : "#888",
          border: `1px solid ${zoom ? "#555" : "#333"}`,
          borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 13, fontFamily: "system-ui",
        }}>{zoom ? "ON" : "OFF"}</button>
      </div>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
        {/* Grayscale */}
        <div>
          <div style={{ color: C.label, fontSize: 12, marginBottom: 6, textAlign: "center", fontFamily: "system-ui" }}>
            Grayscale AA
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, background: "#000", borderRadius: 4 }}>
            {GLYPH_BITMAP.map((row, y) =>
              row.map((val, x) => (
                <rect
                  key={`g-${x}-${y}`}
                  x={x * cellPx}
                  y={y * cellPx}
                  width={cellPx}
                  height={cellPx}
                  fill={`rgb(${Math.round(val * 255)},${Math.round(val * 255)},${Math.round(val * 255)})`}
                  stroke={zoom ? C.gridLine : "none"}
                  strokeWidth={zoom ? 0.5 : 0}
                />
              ))
            )}
            {zoom && GLYPH_BITMAP.map((row, y) =>
              row.map((val, x) =>
                val > 0 ? (
                  <text
                    key={`gt-${x}-${y}`}
                    x={x * cellPx + cellPx / 2}
                    y={y * cellPx + cellPx / 2 + 4}
                    textAnchor="middle"
                    fill={val > 0.5 ? "#000" : "#666"}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {Math.round(val * 255)}
                  </text>
                ) : null
              )
            )}
          </svg>
        </div>

        {/* Subpixel */}
        <div>
          <div style={{ color: C.label, fontSize: 12, marginBottom: 6, textAlign: "center", fontFamily: "system-ui" }}>
            Subpixel (RGB)
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, background: "#000", borderRadius: 4 }}>
            {subpixelData.map((row, y) =>
              row.map(([r, g, b], x) => {
                if (zoom) {
                  // Show individual R/G/B sub-cells
                  const sw = cellPx / 3;
                  return (
                    <g key={`s-${x}-${y}`}>
                      <rect x={x * cellPx} y={y * cellPx} width={sw} height={cellPx} fill={`rgb(${Math.round(r * 255)},0,0)`} />
                      <rect x={x * cellPx + sw} y={y * cellPx} width={sw} height={cellPx} fill={`rgb(0,${Math.round(g * 255)},0)`} />
                      <rect x={x * cellPx + sw * 2} y={y * cellPx} width={sw} height={cellPx} fill={`rgb(0,0,${Math.round(b * 255)})`} />
                      <rect x={x * cellPx} y={y * cellPx} width={cellPx} height={cellPx} fill="none" stroke={C.gridLine} strokeWidth={0.5} />
                    </g>
                  );
                }
                return (
                  <rect
                    key={`s-${x}-${y}`}
                    x={x * cellPx}
                    y={y * cellPx}
                    width={cellPx}
                    height={cellPx}
                    fill={`rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`}
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>
      <div style={{ color: C.label, fontSize: 12, marginTop: 10, fontFamily: "system-ui" }}>
        같은 글리프를 그레이스케일 AA와 서브픽셀 렌더링으로 비교. 확대 모드에서 RGB 서브픽셀 스트라이프를 관찰할 수 있습니다.
      </div>
    </div>
  );
}
