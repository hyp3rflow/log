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
  arrow: "#999",
  cell: "#1a1a1a",
  border: "#444",
  text: "#ccc",
  label: "#888",
  gate: "#c080f0",
  forget: "#f06070",
  cellState: "#f9c74f",
};

function Arrow({ x1, y1, x2, y2, color = C.arrow }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} markerEnd="url(#rnn-arr)" />;
}

// ──────────── RNN Cell ────────────
function RNNCell({ offsetX }: { offsetX: number }) {
  const cx = offsetX + 120;
  const cy = 130;
  const bw = 80;
  const bh = 50;

  return (
    <g>
      <text x={cx} y={28} textAnchor="middle" fill={C.text} fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
        RNN Cell
      </text>

      {/* Cell box */}
      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={8}
        fill={C.cell} stroke={C.hidden + "88"} strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">
        σ(Wh + Wx)
      </text>

      {/* x_t input (bottom) */}
      <text x={cx} y={210} textAnchor="middle" fill={C.input} fontSize={10} fontFamily="system-ui, sans-serif">x_t</text>
      <Arrow x1={cx} y1={198} x2={cx} y2={cy + bh / 2} color={C.input} />

      {/* h_{t-1} input (left) */}
      <text x={cx - bw / 2 - 30} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={10} fontFamily="system-ui, sans-serif">h_(t-1)</text>
      <Arrow x1={cx - bw / 2 - 14} y1={cy} x2={cx - bw / 2} y2={cy} color={C.hidden} />

      {/* h_t output (right) */}
      <text x={cx + bw / 2 + 30} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={10} fontFamily="system-ui, sans-serif">h_t</text>
      <Arrow x1={cx + bw / 2} y1={cy} x2={cx + bw / 2 + 14} y2={cy} color={C.hidden} />

      {/* y_t output (top) */}
      <text x={cx} y={58} textAnchor="middle" fill={C.output} fontSize={10} fontFamily="system-ui, sans-serif">y_t</text>
      <Arrow x1={cx} y1={cy - bh / 2} x2={cx} y2={68} color={C.output} />

      {/* Recurrence arrow */}
      <path
        d={`M${cx + bw / 2 + 6},${cy - 10} C${cx + bw / 2 + 40},${cy - 50} ${cx - bw / 2 - 40},${cy - 50} ${cx - bw / 2 - 6},${cy - 10}`}
        fill="none" stroke={C.hidden} strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
      />
      <text x={cx} y={cy - 52} textAnchor="middle" fill={C.label} fontSize={8} fontFamily="system-ui, sans-serif">recurrence</text>
    </g>
  );
}

// ──────────── LSTM Cell ────────────
function LSTMCell({ offsetX }: { offsetX: number }) {
  const cx = offsetX + 150;
  const cy = 130;
  const bw = 220;
  const bh = 100;

  const gateW = 40;
  const gateH = 28;
  const gateY = cy + 10;

  const gates = [
    { label: "f", name: "Forget", x: cx - 70, color: C.forget },
    { label: "i", name: "Input", x: cx - 20, color: C.gate },
    { label: "c̃", name: "Cell", x: cx + 30, color: C.cellState },
    { label: "o", name: "Output", x: cx + 80, color: C.output },
  ];

  return (
    <g>
      <text x={cx} y={28} textAnchor="middle" fill={C.text} fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
        LSTM Cell
      </text>

      {/* Cell box */}
      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={8}
        fill={C.cell} stroke={C.cellState + "66"} strokeWidth={1.5} />

      {/* Cell state line (top, horizontal) */}
      <line x1={cx - bw / 2} y1={cy - bh / 2 + 14} x2={cx + bw / 2} y2={cy - bh / 2 + 14}
        stroke={C.cellState} strokeWidth={2} opacity={0.6} />
      <text x={cx} y={cy - bh / 2 + 10} textAnchor="middle" fill={C.cellState} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">
        Cell State (c_t)
      </text>

      {/* Gates */}
      {gates.map((g) => (
        <g key={g.label}>
          <rect x={g.x - gateW / 2} y={gateY - gateH / 2} width={gateW} height={gateH} rx={4}
            fill={g.color + "18"} stroke={g.color + "88"} strokeWidth={1} />
          <text x={g.x} y={gateY + 1} textAnchor="middle" fill={g.color} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
            {g.label}
          </text>
          <text x={g.x} y={gateY + gateH / 2 + 14} textAnchor="middle" fill={C.label} fontSize={7} fontFamily="system-ui, sans-serif">
            {g.name}
          </text>
        </g>
      ))}

      {/* x_t input (bottom) */}
      <text x={cx} y={210} textAnchor="middle" fill={C.input} fontSize={10} fontFamily="system-ui, sans-serif">x_t</text>
      <Arrow x1={cx} y1={198} x2={cx} y2={cy + bh / 2} color={C.input} />

      {/* h_{t-1} input (left) */}
      <text x={cx - bw / 2 - 24} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={10} fontFamily="system-ui, sans-serif">h_(t-1)</text>
      <Arrow x1={cx - bw / 2 - 8} y1={cy} x2={cx - bw / 2} y2={cy} color={C.hidden} />

      {/* h_t output (right) */}
      <text x={cx + bw / 2 + 24} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={10} fontFamily="system-ui, sans-serif">h_t</text>
      <Arrow x1={cx + bw / 2} y1={cy} x2={cx + bw / 2 + 8} y2={cy} color={C.hidden} />

      {/* c_{t-1} (left top) */}
      <text x={cx - bw / 2 - 24} y={cy - bh / 2 + 18} textAnchor="middle" fill={C.cellState} fontSize={9} fontFamily="system-ui, sans-serif">c_(t-1)</text>

      {/* c_t (right top) */}
      <text x={cx + bw / 2 + 20} y={cy - bh / 2 + 18} textAnchor="middle" fill={C.cellState} fontSize={9} fontFamily="system-ui, sans-serif">c_t</text>
    </g>
  );
}

export default function RNNCellDiagram() {
  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        RNN Cell vs LSTM Cell — 구조 비교
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox="0 0 620 230" width="100%" style={{ maxWidth: 620 }}>
          <defs>
            <marker id="rnn-arr" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0,0 10,3.5 0,7" fill={C.arrow} />
            </marker>
          </defs>

          {/* Divider */}
          <line x1={280} y1={15} x2={280} y2={215} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="6,4" />

          <RNNCell offsetX={30} />
          <LSTMCell offsetX={290} />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "11px" }}>
        <span><span style={{ color: C.forget, fontWeight: 600 }}>Forget Gate</span> — 이전 cell state에서 버릴 정보 결정</span>
        <span><span style={{ color: C.gate, fontWeight: 600 }}>Input Gate</span> — 새로 저장할 정보 결정</span>
        <span><span style={{ color: C.output, fontWeight: 600 }}>Output Gate</span> — cell state에서 출력할 정보 결정</span>
        <span><span style={{ color: C.cellState, fontWeight: 600 }}>Cell State</span> — 장기 기억을 전달하는 컨베이어 벨트</span>
      </div>
    </div>
  );
}
