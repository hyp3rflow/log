"use client";

const C = {
  bg: "#111",
  cell: "#1a1a1a",
  border: "#333",
  text: "#ccc",
  label: "#888",
  q: "#6eb5ff",
  k: "#f0a050",
  v: "#60c080",
  score: "#c080f0",
  out: "#f9c74f",
  arrow: "#888",
};

const F = "system-ui, sans-serif";

function Matrix({
  x, y, w, h, rows, cols, color, label, values,
}: {
  x: number; y: number; w: number; h: number;
  rows: number; cols: number; color: string; label: string;
  values?: string[][];
}) {
  const cw = w / cols;
  const ch = h / rows;
  return (
    <g>
      {/* Bracket left */}
      <path d={`M${x + 4},${y} L${x},${y} L${x},${y + h} L${x + 4},${y + h}`}
        fill="none" stroke={color} strokeWidth={1.5} />
      {/* Bracket right */}
      <path d={`M${x + w - 4},${y} L${x + w},${y} L${x + w},${y + h} L${x + w - 4},${y + h}`}
        fill="none" stroke={color} strokeWidth={1.5} />
      {/* Grid */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect key={`${r}-${c}`}
            x={x + c * cw + 1} y={y + r * ch + 1}
            width={cw - 2} height={ch - 2}
            rx={2} fill={color + "12"} stroke={color + "33"} strokeWidth={0.5}
          />
        ))
      )}
      {/* Values */}
      {values && values.map((row, r) =>
        row.map((val, c) => (
          <text key={`v${r}-${c}`}
            x={x + c * cw + cw / 2} y={y + r * ch + ch / 2 + 4}
            textAnchor="middle" fill={color + "cc"} fontSize={9} fontFamily={F}>
            {val}
          </text>
        ))
      )}
      {/* Label */}
      <text x={x + w / 2} y={y - 8} textAnchor="middle"
        fill={color} fontSize={12} fontWeight={700} fontFamily={F}>
        {label}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={C.arrow} strokeWidth={1.2} markerEnd="url(#sa-arr)" />
      {label && (
        <text x={mx} y={my - 6} textAnchor="middle"
          fill={C.label} fontSize={9} fontFamily={F}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function SelfAttentionDiagram() {
  // Layout
  const n = 4; // sequence length
  const d = 3; // dimension (visual)
  const mw = 72; // matrix width
  const mh = 80; // matrix height (n rows)
  const mhSmall = 60; // d-row matrices
  const gap = 28;

  // Tokens
  const tokens = ["The", "cat", "sat", "on"];

  // Row 1: Input X → Q, K, V
  const xX = 30;
  const r1Y = 60;

  const qX = xX + mw + gap + 50;
  const kX = qX + mw + gap;
  const vX = kX + mw + gap;

  // Row 2: QK^T → scores → softmax → × V → output
  const r2Y = 200;
  const scoreX = qX;
  const scoreW = 80;
  const softX = scoreX + scoreW + gap + 20;
  const outX = softX + scoreW + gap + 20;

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      background: C.bg,
      padding: 24,
      margin: "2rem 0",
    }}>
      <div style={{ fontSize: 13, color: C.label, marginBottom: 8 }}>
        Self-Attention 연산 과정 — 4개 토큰 예시
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox="0 0 640 420" width="100%" style={{ maxWidth: 640 }}>
          <defs>
            <marker id="sa-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill={C.arrow} />
            </marker>
          </defs>

          {/* ── Step 1: Input X ── */}
          <text x={xX + mw / 2} y={30} textAnchor="middle"
            fill={C.text} fontSize={11} fontWeight={600} fontFamily={F}>
            ① 입력 임베딩
          </text>
          <Matrix x={xX} y={r1Y} w={mw} h={mh} rows={n} cols={d}
            color={C.text} label="X (n×d)"
            values={tokens.map(t => [t, "···", ""])}
          />

          {/* ── Arrows X → Q, K, V ── */}
          <Arrow x1={xX + mw + 4} y1={r1Y + 15} x2={qX - 4} y2={r1Y + 15} label="× W_Q" />
          <Arrow x1={xX + mw + 4} y1={r1Y + mh / 2} x2={kX - 4} y2={r1Y + mh / 2} label="× W_K" />
          <Arrow x1={xX + mw + 4} y1={r1Y + mh - 15} x2={vX - 4} y2={r1Y + mh - 15} label="× W_V" />

          {/* ── Step 2: Q, K, V matrices ── */}
          <text x={(qX + vX + mw) / 2} y={30} textAnchor="middle"
            fill={C.text} fontSize={11} fontWeight={600} fontFamily={F}>
            ② 선형 변환
          </text>
          <Matrix x={qX} y={r1Y} w={mw} h={mh} rows={n} cols={d}
            color={C.q} label="Q"
          />
          <Matrix x={kX} y={r1Y} w={mw} h={mh} rows={n} cols={d}
            color={C.k} label="K"
          />
          <Matrix x={vX} y={r1Y} w={mw} h={mh} rows={n} cols={d}
            color={C.v} label="V"
          />

          {/* ── Step 3: QK^T score matrix ── */}
          <text x={scoreX + scoreW / 2} y={r2Y - 24} textAnchor="middle"
            fill={C.text} fontSize={11} fontWeight={600} fontFamily={F}>
            ③ QKᵀ / √d_k
          </text>

          {/* Arrows from Q and K down to score */}
          <Arrow x1={qX + mw / 2} y1={r1Y + mh + 4} x2={scoreX + scoreW / 4} y2={r2Y - 4} />
          <Arrow x1={kX + mw / 2} y1={r1Y + mh + 4} x2={scoreX + scoreW * 3 / 4} y2={r2Y - 4} />

          <Matrix x={scoreX} y={r2Y} w={scoreW} h={scoreW} rows={n} cols={n}
            color={C.score} label="Scores (n×n)"
            values={[
              [".9", ".1", ".0", ".0"],
              [".2", ".5", ".2", ".1"],
              [".1", ".3", ".4", ".2"],
              [".0", ".1", ".3", ".6"],
            ]}
          />

          {/* Token labels on score matrix */}
          {tokens.map((t, i) => (
            <text key={`sl-${i}`} x={scoreX - 6} y={r2Y + (i + 0.5) * (scoreW / n) + 3}
              textAnchor="end" fill={C.label} fontSize={8} fontFamily={F}>
              {t}
            </text>
          ))}
          {tokens.map((t, i) => (
            <text key={`st-${i}`} x={scoreX + (i + 0.5) * (scoreW / n)} y={r2Y + scoreW + 14}
              textAnchor="middle" fill={C.label} fontSize={8} fontFamily={F}>
              {t}
            </text>
          ))}

          {/* ── Step 4: Softmax ── */}
          <Arrow x1={scoreX + scoreW + 4} y1={r2Y + scoreW / 2} x2={softX - 4} y2={r2Y + scoreW / 2} label="softmax" />

          <text x={softX + scoreW / 2} y={r2Y - 24} textAnchor="middle"
            fill={C.text} fontSize={11} fontWeight={600} fontFamily={F}>
            ④ Softmax
          </text>
          <Matrix x={softX} y={r2Y} w={scoreW} h={scoreW} rows={n} cols={n}
            color={C.score} label="Attention Weights"
            values={[
              [".7", ".2", ".1", ".0"],
              [".2", ".4", ".2", ".2"],
              [".1", ".2", ".4", ".3"],
              [".0", ".1", ".3", ".6"],
            ]}
          />

          {/* ── Step 5: × V → Output ── */}
          <Arrow x1={softX + scoreW + 4} y1={r2Y + scoreW / 2} x2={outX - 4} y2={r2Y + scoreW / 2} label="× V" />

          {/* Arrow from V down to output */}
          <Arrow x1={vX + mw / 2} y1={r1Y + mh + 4} x2={outX + mw / 2} y2={r2Y - 4} />

          <text x={outX + mw / 2} y={r2Y - 24} textAnchor="middle"
            fill={C.text} fontSize={11} fontWeight={600} fontFamily={F}>
            ⑤ 가중합
          </text>
          <Matrix x={outX} y={r2Y} w={mw} h={scoreW} rows={n} cols={d}
            color={C.out} label="Output (n×d)"
          />

          {/* ── Explanation ── */}
          <text x={20} y={r2Y + scoreW + 40} fill={C.label} fontSize={10} fontFamily={F}>
            각 행 = 해당 토큰이 다른 토큰들의 Value를 얼마나 참조할지의 가중치
          </text>
          <text x={20} y={r2Y + scoreW + 56} fill={C.label} fontSize={10} fontFamily={F}>
            예: "The"의 출력 = 0.7×V_The + 0.2×V_cat + 0.1×V_sat + 0.0×V_on
          </text>
        </svg>
      </div>
    </div>
  );
}
