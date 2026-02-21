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
      <path d={`M${x + 5},${y} L${x},${y} L${x},${y + h} L${x + 5},${y + h}`}
        fill="none" stroke={color} strokeWidth={1.8} />
      <path d={`M${x + w - 5},${y} L${x + w},${y} L${x + w},${y + h} L${x + w - 5},${y + h}`}
        fill="none" stroke={color} strokeWidth={1.8} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect key={`${r}-${c}`}
            x={x + c * cw + 1} y={y + r * ch + 1}
            width={cw - 2} height={ch - 2}
            rx={3} fill={color + "12"} stroke={color + "33"} strokeWidth={0.5}
          />
        ))
      )}
      {values && values.map((row, r) =>
        row.map((val, c) => (
          <text key={`v${r}-${c}`}
            x={x + c * cw + cw / 2} y={y + r * ch + ch / 2 + 5}
            textAnchor="middle" fill={color + "cc"} fontSize={12} fontFamily={F}>
            {val}
          </text>
        ))
      )}
      <text x={x + w / 2} y={y - 12} textAnchor="middle"
        fill={color} fontSize={15} fontWeight={700} fontFamily={F}>
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
        stroke={C.arrow} strokeWidth={1.4} markerEnd="url(#sa-arr)" />
      {label && (
        <text x={mx} y={my - 8} textAnchor="middle"
          fill={C.label} fontSize={11} fontFamily={F}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function SelfAttentionDiagram() {
  const tokens = ["The", "cat", "sat", "on"];

  // ── Row 1: X → Q, K, V ──
  const mw = 100;
  const mh = 110;
  const gap = 36;

  const xX = 40;
  const r1Y = 80;

  const qX = xX + mw + gap + 60;
  const kX = qX + mw + gap;
  const vX = kX + mw + gap;

  // ── Row 2: Scores → Softmax → Output ──
  const r2Y = 280;
  const scoreW = 110;
  const scoreH = 110;
  const softX_start = qX;
  const softX = softX_start + scoreW + gap + 30;
  const outX = softX + scoreW + gap + 30;

  const totalW = outX + mw + 40;
  const totalH = r2Y + scoreH + 80;

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      background: C.bg,
      padding: 24,
      margin: "2rem 0",
    }}>
      <div style={{ fontSize: 14, color: C.label, marginBottom: 10 }}>
        Self-Attention 연산 과정 — 4개 토큰 예시
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: totalW }}>
          <defs>
            <marker id="sa-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill={C.arrow} />
            </marker>
          </defs>

          {/* ── Step 1: Input X ── */}
          <text x={xX + mw / 2} y={36} textAnchor="middle"
            fill={C.text} fontSize={14} fontWeight={600} fontFamily={F}>
            ① 입력 임베딩
          </text>
          <Matrix x={xX} y={r1Y} w={mw} h={mh} rows={4} cols={3}
            color={C.text} label="X (n×d)"
            values={tokens.map(t => [t, "···", ""])}
          />

          {/* ── Arrows X → Q, K, V ── */}
          <Arrow x1={xX + mw + 6} y1={r1Y + 20} x2={qX - 6} y2={r1Y + 20} label="× W_Q" />
          <Arrow x1={xX + mw + 6} y1={r1Y + mh / 2} x2={kX - 6} y2={r1Y + mh / 2} label="× W_K" />
          <Arrow x1={xX + mw + 6} y1={r1Y + mh - 20} x2={vX - 6} y2={r1Y + mh - 20} label="× W_V" />

          {/* ── Step 2: Q, K, V ── */}
          <text x={(qX + vX + mw) / 2} y={36} textAnchor="middle"
            fill={C.text} fontSize={14} fontWeight={600} fontFamily={F}>
            ② 선형 변환
          </text>
          <Matrix x={qX} y={r1Y} w={mw} h={mh} rows={4} cols={3} color={C.q} label="Q" />
          <Matrix x={kX} y={r1Y} w={mw} h={mh} rows={4} cols={3} color={C.k} label="K" />
          <Matrix x={vX} y={r1Y} w={mw} h={mh} rows={4} cols={3} color={C.v} label="V" />

          {/* ── Step 3: QK^T ── */}
          <text x={softX_start + scoreW / 2} y={r2Y - 30} textAnchor="middle"
            fill={C.text} fontSize={14} fontWeight={600} fontFamily={F}>
            ③ QKᵀ / √d_k
          </text>
          <Arrow x1={qX + mw / 2} y1={r1Y + mh + 6} x2={softX_start + scoreW / 3} y2={r2Y - 6} />
          <Arrow x1={kX + mw / 2} y1={r1Y + mh + 6} x2={softX_start + scoreW * 2 / 3} y2={r2Y - 6} />

          <Matrix x={softX_start} y={r2Y} w={scoreW} h={scoreH} rows={4} cols={4}
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
            <text key={`sl-${i}`} x={softX_start - 8} y={r2Y + (i + 0.5) * (scoreH / 4) + 4}
              textAnchor="end" fill={C.label} fontSize={10} fontFamily={F}>
              {t}
            </text>
          ))}
          {tokens.map((t, i) => (
            <text key={`st-${i}`} x={softX_start + (i + 0.5) * (scoreW / 4)} y={r2Y + scoreH + 18}
              textAnchor="middle" fill={C.label} fontSize={10} fontFamily={F}>
              {t}
            </text>
          ))}

          {/* ── Step 4: Softmax ── */}
          <Arrow x1={softX_start + scoreW + 6} y1={r2Y + scoreH / 2} x2={softX - 6} y2={r2Y + scoreH / 2} label="softmax" />

          <text x={softX + scoreW / 2} y={r2Y - 30} textAnchor="middle"
            fill={C.text} fontSize={14} fontWeight={600} fontFamily={F}>
            ④ Softmax
          </text>
          <Matrix x={softX} y={r2Y} w={scoreW} h={scoreH} rows={4} cols={4}
            color={C.score} label="Weights"
            values={[
              [".7", ".2", ".1", ".0"],
              [".2", ".4", ".2", ".2"],
              [".1", ".2", ".4", ".3"],
              [".0", ".1", ".3", ".6"],
            ]}
          />

          {/* ── Step 5: × V → Output ── */}
          <Arrow x1={softX + scoreW + 6} y1={r2Y + scoreH / 2} x2={outX - 6} y2={r2Y + scoreH / 2} label="× V" />
          <Arrow x1={vX + mw / 2} y1={r1Y + mh + 6} x2={outX + mw / 2} y2={r2Y - 6} />

          <text x={outX + mw / 2} y={r2Y - 30} textAnchor="middle"
            fill={C.text} fontSize={14} fontWeight={600} fontFamily={F}>
            ⑤ 가중합
          </text>
          <Matrix x={outX} y={r2Y} w={mw} h={scoreH} rows={4} cols={3}
            color={C.out} label="Output (n×d)"
          />

          {/* ── Explanation ── */}
          <text x={30} y={r2Y + scoreH + 46} fill={C.label} fontSize={12} fontFamily={F}>
            각 행 = 해당 토큰이 다른 토큰들의 Value를 얼마나 참조할지의 가중치
          </text>
          <text x={30} y={r2Y + scoreH + 66} fill={C.label} fontSize={12} fontFamily={F}>
            예: "The"의 출력 = 0.7 × V_The + 0.2 × V_cat + 0.1 × V_sat + 0.0 × V_on
          </text>
        </svg>
      </div>
    </div>
  );
}
