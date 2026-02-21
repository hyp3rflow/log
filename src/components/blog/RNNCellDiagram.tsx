"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const C = {
  input: "#6eb5ff",
  hidden: "#f0a050",
  output: "#60c080",
  arrow: "#888",
  cell: "#1a1a1a",
  text: "#ccc",
  label: "#777",
  gate: "#c080f0",
  forget: "#f06070",
  cellState: "#f9c74f",
};

/* ─────────────── RNN Section ─────────────── */
function RNNSection() {
  const W = 500;
  const cx = W / 2;
  const cy = 100;
  const bw = 120;
  const bh = 50;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
        RNN Cell — 순차적 hidden state 전달
      </div>
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} 200`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="rnn-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill={C.arrow} />
            </marker>
          </defs>

          {/* ── Cell Box ── */}
          <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={8}
            fill={C.cell} stroke={C.hidden + "88"} strokeWidth={1.5} />
          <text x={cx} y={cy + 5} textAnchor="middle" fill={C.hidden}
            fontSize={13} fontWeight={600} fontFamily="system-ui, sans-serif">
            σ(Wh + Wx + b)
          </text>

          {/* ── x_t (bottom → cell) ── */}
          <line x1={cx} y1={180} x2={cx} y2={cy + bh / 2 + 2}
            stroke={C.input} strokeWidth={1.5} markerEnd="url(#rnn-a)" />
          <text x={cx + 14} y={174} fill={C.input} fontSize={12} fontFamily="system-ui, sans-serif">
            x_t
          </text>

          {/* ── y_t (cell → top) ── */}
          <line x1={cx} y1={cy - bh / 2 - 2} x2={cx} y2={24}
            stroke={C.output} strokeWidth={1.5} markerEnd="url(#rnn-a)" />
          <text x={cx + 14} y={32} fill={C.output} fontSize={12} fontFamily="system-ui, sans-serif">
            y_t
          </text>

          {/* ── h_{t-1} (left → cell) ── */}
          <line x1={80} y1={cy} x2={cx - bw / 2 - 2} y2={cy}
            stroke={C.hidden} strokeWidth={1.5} markerEnd="url(#rnn-a)" />
          <text x={60} y={cy - 8} textAnchor="middle" fill={C.hidden} fontSize={12} fontFamily="system-ui, sans-serif">
            h_(t−1)
          </text>

          {/* ── h_t (cell → right) ── */}
          <line x1={cx + bw / 2 + 2} y1={cy} x2={W - 80} y2={cy}
            stroke={C.hidden} strokeWidth={1.5} markerEnd="url(#rnn-a)" />
          <text x={W - 60} y={cy - 8} textAnchor="middle" fill={C.hidden} fontSize={12} fontFamily="system-ui, sans-serif">
            h_t
          </text>

          {/* ── Recurrence (curved arrow h_t → h_{t-1}) ── */}
          <path
            d={`M${W - 90},${cy + 16} Q${W - 60},${cy + 60} ${cx},${cy + 60} Q${100},${cy + 60} ${90},${cy + 16}`}
            fill="none" stroke={C.hidden} strokeWidth={1} strokeDasharray="5,3" opacity={0.4}
          />
          <text x={cx} y={cy + 72} textAnchor="middle" fill={C.label} fontSize={9} fontFamily="system-ui, sans-serif">
            recurrence (순차 처리 — 병렬화 불가)
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────── LSTM Section ─────────────── */
function LSTMSection() {
  const W = 560;
  const cx = W / 2;
  const topY = 50;
  const cellH = 160;
  const cellW = 360;
  const cellLeft = cx - cellW / 2;
  const cellRight = cx + cellW / 2;

  // Cell state line Y
  const csY = topY + 30;
  // Gates Y
  const gateY = topY + 100;
  const gateW = 56;
  const gateH = 36;
  const gateGap = 80;
  const gateStart = cx - gateGap * 1.5;

  const gates = [
    { label: "f", name: "Forget Gate", x: gateStart, color: C.forget, desc: "이전 정보 중 버릴 것" },
    { label: "i", name: "Input Gate", x: gateStart + gateGap, color: C.gate, desc: "새로 저장할 정보" },
    { label: "c̃", name: "Candidate", x: gateStart + gateGap * 2, color: C.cellState, desc: "새 셀 후보값" },
    { label: "o", name: "Output Gate", x: gateStart + gateGap * 3, color: C.output, desc: "출력할 정보" },
  ];

  return (
    <div>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
        LSTM Cell — Gate로 정보 흐름을 제어
      </div>
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} 280`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="lstm-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill={C.arrow} />
            </marker>
          </defs>

          {/* ── Main cell box ── */}
          <rect x={cellLeft} y={topY} width={cellW} height={cellH} rx={10}
            fill={C.cell} stroke="#333" strokeWidth={1} />

          {/* ── Cell State line (horizontal through top) ── */}
          <line x1={cellLeft - 40} y1={csY} x2={cellRight + 40} y2={csY}
            stroke={C.cellState} strokeWidth={2.5} opacity={0.5} markerEnd="url(#lstm-a)" />
          <text x={cellLeft - 52} y={csY + 5} textAnchor="end" fill={C.cellState} fontSize={11} fontFamily="system-ui, sans-serif">
            c_(t−1)
          </text>
          <text x={cellRight + 52} y={csY + 5} fill={C.cellState} fontSize={11} fontFamily="system-ui, sans-serif">
            c_t
          </text>
          <text x={cx} y={csY - 10} textAnchor="middle" fill={C.cellState + "99"} fontSize={9} fontWeight={600} fontFamily="system-ui, sans-serif">
            Cell State — 장기 기억 전달
          </text>

          {/* ── Gates ── */}
          {gates.map((g) => (
            <g key={g.label}>
              <rect x={g.x - gateW / 2} y={gateY - gateH / 2} width={gateW} height={gateH} rx={6}
                fill={g.color + "15"} stroke={g.color + "77"} strokeWidth={1.2} />
              <text x={g.x} y={gateY + 4} textAnchor="middle" fill={g.color}
                fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
                {g.label}
              </text>
              {/* Connection from gate to cell state */}
              <line x1={g.x} y1={gateY - gateH / 2 - 2} x2={g.x} y2={csY + 4}
                stroke={g.color + "55"} strokeWidth={1} strokeDasharray="3,2" />
            </g>
          ))}

          {/* ── h_{t-1} (left → cell) ── */}
          <line x1={cellLeft - 40} y1={gateY} x2={cellLeft - 2} y2={gateY}
            stroke={C.hidden} strokeWidth={1.5} markerEnd="url(#lstm-a)" />
          <text x={cellLeft - 52} y={gateY + 5} textAnchor="end" fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">
            h_(t−1)
          </text>

          {/* ── h_t (cell → right) ── */}
          <line x1={cellRight + 2} y1={gateY} x2={cellRight + 40} y2={gateY}
            stroke={C.hidden} strokeWidth={1.5} markerEnd="url(#lstm-a)" />
          <text x={cellRight + 52} y={gateY + 5} fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">
            h_t
          </text>

          {/* ── x_t (bottom → cell) ── */}
          <line x1={cx} y1={260} x2={cx} y2={topY + cellH + 2}
            stroke={C.input} strokeWidth={1.5} markerEnd="url(#lstm-a)" />
          <text x={cx + 14} y={258} fill={C.input} fontSize={12} fontFamily="system-ui, sans-serif">
            x_t
          </text>

          {/* ── Gate labels below ── */}
          {gates.map((g) => (
            <text key={g.label + "-lbl"} x={g.x} y={gateY + gateH / 2 + 18}
              textAnchor="middle" fill={C.label} fontSize={9} fontFamily="system-ui, sans-serif">
              {g.name}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px 16px" }}>
        {gates.map((g) => (
          <div key={g.label} style={{ fontSize: "12px", color: "#aaa" }}>
            <span style={{ color: g.color, fontWeight: 600 }}>{g.name}</span>
            <span> — {g.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RNNCellDiagram() {
  return (
    <div style={WRAPPER}>
      <RNNSection />
      <LSTMSection />
    </div>
  );
}
