"use client";

import { useState, useCallback, useRef } from "react";

const C = {
  bg: "#111",
  grid: "#1a1a1a",
  gridLine: "#222",
  curve: "#6eb5ff",
  quadCurve: "#f0a050",
  controlLine: "#444",
  controlPoint: "#f9c74f",
  onCurvePoint: "#60c080",
  text: "#ccc",
  label: "#888",
};

interface Point {
  x: number;
  y: number;
}

function evalQuadBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function evalCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function bezierPath(points: Point[], steps: number, cubic: boolean): string {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (cubic) {
      pts.push(evalCubicBezier(points[0], points[1], points[2], points[3], t));
    } else {
      pts.push(evalQuadBezier(points[0], points[1], points[2], t));
    }
  }
  return "M" + pts.map((p) => `${p.x},${p.y}`).join(" L");
}

export default function BezierCurveEditor() {
  const [mode, setMode] = useState<"quadratic" | "cubic">("quadratic");
  const [quadPts, setQuadPts] = useState<Point[]>([
    { x: 60, y: 260 },
    { x: 200, y: 40 },
    { x: 340, y: 260 },
  ]);
  const [cubicPts, setCubicPts] = useState<Point[]>([
    { x: 60, y: 260 },
    { x: 140, y: 40 },
    { x: 260, y: 40 },
    { x: 340, y: 260 },
  ]);
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = mode === "quadratic" ? quadPts : cubicPts;
  const setPoints = mode === "quadratic" ? setQuadPts : setCubicPts;

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 300,
    };
  }, []);

  const onDown = useCallback((idx: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(idx);
  }, []);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (dragging === null) return;
    e.preventDefault();
    const pos = getPos(e);
    setPoints((prev) => prev.map((p, i) => (i === dragging ? { x: Math.max(0, Math.min(400, pos.x)), y: Math.max(0, Math.min(300, pos.y)) } : p)));
  }, [dragging, getPos, setPoints]);

  const onUp = useCallback(() => setDragging(null), []);

  const isCubic = mode === "cubic";
  const curvePath = bezierPath(points, 64, isCubic);

  const labels = isCubic
    ? ["P₀ (on-curve)", "P₁ (control)", "P₂ (control)", "P₃ (on-curve)"]
    : ["P₀ (on-curve)", "P₁ (control)", "P₂ (on-curve)"];

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: 16, margin: "1.5rem 0" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <span style={{ color: C.text, fontSize: 14, fontFamily: "system-ui" }}>곡선 유형:</span>
        {(["quadratic", "cubic"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "#333" : "#1a1a1a",
              color: mode === m ? "#fff" : "#888",
              border: `1px solid ${mode === m ? "#555" : "#333"}`,
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "system-ui",
            }}
          >
            {m === "quadratic" ? "2차 (TrueType)" : "3차 (CFF/OpenType)"}
          </button>
        ))}
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        style={{ width: "100%", maxWidth: 500, background: C.grid, borderRadius: 6, touchAction: "none", cursor: dragging !== null ? "grabbing" : "default" }}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      >
        {/* grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`gv${i}`} x1={(i + 1) * 40} y1={0} x2={(i + 1) * 40} y2={300} stroke={C.gridLine} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`gh${i}`} x1={0} y1={(i + 1) * 40} x2={400} y2={(i + 1) * 40} stroke={C.gridLine} strokeWidth={0.5} />
        ))}

        {/* control lines */}
        {isCubic ? (
          <>
            <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={C.controlLine} strokeWidth={1} strokeDasharray="4,3" />
            <line x1={points[2].x} y1={points[2].y} x2={points[3].x} y2={points[3].y} stroke={C.controlLine} strokeWidth={1} strokeDasharray="4,3" />
          </>
        ) : (
          <>
            <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={C.controlLine} strokeWidth={1} strokeDasharray="4,3" />
            <line x1={points[1].x} y1={points[1].y} x2={points[2].x} y2={points[2].y} stroke={C.controlLine} strokeWidth={1} strokeDasharray="4,3" />
          </>
        )}

        {/* curve */}
        <path d={curvePath} fill="none" stroke={isCubic ? C.curve : C.quadCurve} strokeWidth={2.5} />

        {/* points */}
        {points.map((p, i) => {
          const isControl = isCubic ? (i === 1 || i === 2) : i === 1;
          return (
            <g key={i} style={{ cursor: "grab" }} onMouseDown={onDown(i)} onTouchStart={onDown(i)}>
              {isControl ? (
                <rect x={p.x - 6} y={p.y - 6} width={12} height={12} rx={2} fill={C.controlPoint} stroke="#000" strokeWidth={1} />
              ) : (
                <circle cx={p.x} cy={p.y} r={7} fill={C.onCurvePoint} stroke="#000" strokeWidth={1} />
              )}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill={C.label} fontSize={10} fontFamily="system-ui">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ color: C.label, fontSize: 12, marginTop: 8, fontFamily: "system-ui" }}>
        포인트를 드래그하여 곡선을 조절할 수 있습니다. ■ = 컨트롤 포인트 (off-curve), ● = 온커브 포인트
      </div>
    </div>
  );
}
