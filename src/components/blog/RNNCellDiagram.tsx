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
  text: "#ccc",
  label: "#888",
  gate: "#c080f0",
  forget: "#f06070",
  cellState: "#f9c74f",
};

function Arrow({ x1, y1, x2, y2, color = C.arrow }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} markerEnd="url(#rnn-arr)" />;
}

function RNNCell({ offsetX }: { offsetX: number }) {
  const cx = offsetX + 140;
  const cy = 160;
  const bw = 100;
  const bh = 56;

  return (
    <g>
      <text x={cx} y={30} textAnchor="middle" fill={C.text} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
        RNN Cell
      </text>

      {/* Cell box */}
      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={8}
        fill={C.cell} stroke={C.hidden + "88"} strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
        σ(Wh + Wx)
      </text>

      {/* x_t input (bottom) */}
      <text x={cx} y={270} textAnchor="middle" fill={C.input} fontSize={11} fontFamily="system-ui, sans-serif">x_t</text>
      <Arrow x1={cx} y1={256} x2={cx} y2={cy + bh / 2 + 2} color={C.input} />

      {/* h_{t-1} input (left) */}
      <text x={cx - bw / 2 - 42} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">h_(t-1)</text>
      <Arrow x1={cx - bw / 2 - 18} y1={cy} x2={cx - bw / 2 - 2} y2={cy} color={C.hidden} />

      {/* h_t output (right) */}
      <text x={cx + bw / 2 + 42} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">h_t</text>
      <Arrow x1={cx + bw / 2 + 2} y1={cy} x2={cx + bw / 2 + 18} y2={cy} color={C.hidden} />

      {/* y_t output (top) */}
      <text x={cx} y={68} textAnchor="middle" fill={C.output} fontSize={11} fontFamily="system-ui, sans-serif">y_t</text>
      <Arrow x1={cx} y1={cy - bh / 2 - 2} x2={cx} y2={78} color={C.output} />

      {/* Recurrence arrow */}
      <path
        d={`M${cx + bw / 2 + 8},${cy - 14} C${cx + bw / 2 + 48},${cy - 60} ${cx - bw / 2 - 48},${cy - 60} ${cx - bw / 2 - 8},${cy - 14}`}
        fill="none" stroke={C.hidden} strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
      />
      <text x={cx} y={cy - 62} textAnchor="middle" fill={C.label} fontSize={9} fontFamily="system-ui, sans-serif">recurrence</text>
    </g>
  );
}

function LSTMCell({ offsetX }: { offsetX: number }) {
  const cx = offsetX + 170;
  const cy = 160;
  const bw = 260;
  const bh = 120;

  const gateW = 46;
  const gateH = 32;
  const gateY = cy + 16;
  const gateGap = 60;
  const gateStartX = cx - (gateGap * 1.5);

  const gates = [
    { label: "f", name: "Forget", x: gateStartX, color: C.forget },
    { label: "i", name: "Input", x: gateStartX + gateGap, color: C.gate },
    { label: "c̃", name: "Cell", x: gateStartX + gateGap * 2, color: C.cellState },
    { label: "o", name: "Output", x: gateStartX + gateGap * 3, color: C.output },
  ];

  return (
    <g>
      <text x={cx} y={30} textAnchor="middle" fill={C.text} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
        LSTM Cell
      </text>

      {/* Cell box */}
      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={8}
        fill={C.cell} stroke={C.cellState + "44"} strokeWidth={1.5} />

      {/* Cell state line */}
      <line x1={cx - bw / 2} y1={cy - bh / 2 + 18} x2={cx + bw / 2} y2={cy - bh / 2 + 18}
        stroke={C.cellState} strokeWidth={2} opacity={0.5} />
      <text x={cx} y={cy - bh / 2 + 13} textAnchor="middle" fill={C.cellState} fontSize={9} fontWeight={600} fontFamily="system-ui, sans-serif">
        Cell State (c_t)
      </text>

      {/* Gates */}
      {gates.map((g) => (
        <g key={g.label}>
          <rect x={g.x - gateW / 2} y={gateY - gateH / 2} width={gateW} height={gateH} rx={5}
            fill={g.color + "18"} stroke={g.color + "88"} strokeWidth={1} />
          <text x={g.x} y={gateY + 2} textAnchor="middle" fill={g.color} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">
            {g.label}
          </text>
          <text x={g.x} y={gateY + gateH / 2 + 16} textAnchor="middle" fill={C.label} fontSize={8} fontFamily="system-ui, sans-serif">
            {g.name}
          </text>
        </g>
      ))}

      {/* x_t input (bottom) */}
      <text x={cx} y={270} textAnchor="middle" fill={C.input} fontSize={11} fontFamily="system-ui, sans-serif">x_t</text>
      <Arrow x1={cx} y1={256} x2={cx} y2={cy + bh / 2 + 2} color={C.input} />

      {/* h_{t-1} input (left) */}
      <text x={cx - bw / 2 - 34} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">h_(t-1)</text>
      <Arrow x1={cx - bw / 2 - 10} y1={cy} x2={cx - bw / 2 - 2} y2={cy} color={C.hidden} />

      {/* h_t output (right) */}
      <text x={cx + bw / 2 + 34} y={cy + 4} textAnchor="middle" fill={C.hidden} fontSize={11} fontFamily="system-ui, sans-serif">h_t</text>
      <Arrow x1={cx + bw / 2 + 2} y1={cy} x2={cx + bw / 2 + 10} y2={cy} color={C.hidden} />

      {/* c_{t-1} / c_t */}
      <text x={cx - bw / 2 - 30} y={cy - bh / 2 + 22} textAnchor="middle" fill={C.cellState} fontSize={10} fontFamily="system-ui, sans-serif">c_(t-1)</text>
      <text x={cx + bw / 2 + 28} y={cy - bh / 2 + 22} textAnchor="middle" fill={C.cellState} fontSize={10} fontFamily="system-ui, sans-serif">c_t</text>
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
        <svg viewBox="0 0 720 290" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <marker id="rnn-arr" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0,0 10,3.5 0,7" fill={C.arrow} />
            </marker>
          </defs>

          {/* Divider */}
          <line x1={320} y1={15} x2={320} y2={275} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="6,4" />

          <RNNCell offsetX={20} />
          <LSTMCell offsetX={330} />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", fontSize: "12px", color: "#aaa" }}>
        <span><span style={{ color: C.forget, fontWeight: 600 }}>Forget Gate</span> — 이전 cell state에서 버릴 정보 결정</span>
        <span><span style={{ color: C.gate, fontWeight: 600 }}>Input Gate</span> — 새로 저장할 정보 결정</span>
        <span><span style={{ color: C.output, fontWeight: 600 }}>Output Gate</span> — cell state에서 출력할 정보 결정</span>
        <span><span style={{ color: C.cellState, fontWeight: 600 }}>Cell State</span> — 장기 기억을 전달하는 컨베이어 벨트</span>
      </div>
    </div>
  );
}
