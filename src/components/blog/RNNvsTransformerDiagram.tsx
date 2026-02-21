"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const COLORS = {
  token: "#6090e0",
  arrow: "#888",
  connection: "#888",
  label: "#ccc",
  sublabel: "#888",
};

function Token({ cx, cy, label }: { cx: number; cy: number; label: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill={COLORS.token} opacity={0.85} />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize={13}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}

function Arrow({
  x1, y1, x2, y2,
}: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const r = 24;
  return (
    <line
      x1={x1 + ux * r}
      y1={y1 + uy * r}
      x2={x2 - ux * r}
      y2={y2 - uy * r}
      stroke={COLORS.arrow}
      strokeWidth={1.5}
      markerEnd="url(#arrowhead-rnn)"
    />
  );
}

function Connection({
  x1, y1, x2, y2,
}: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const r = 24;
  return (
    <line
      x1={x1 + ux * r}
      y1={y1 + uy * r}
      x2={x2 - ux * r}
      y2={y2 - uy * r}
      stroke={COLORS.connection}
      strokeWidth={1.2}
      opacity={0.5}
    />
  );
}

export default function RNNvsTransformerDiagram() {
  const tokens = ["x₁", "x₂", "x₃", "x₄"];
  const rnnX = [60, 130, 200, 270];
  const rnnY = 100;
  const tfX = [400, 470, 540, 610];
  const tfY = 100;

  // All pairs for transformer connections
  const pairs: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      pairs.push([i, j]);
    }
  }

  return (
    <div style={WRAPPER}>
      <svg
        viewBox="0 0 670 180"
        width="100%"
        style={{ maxWidth: 670, display: "block", margin: "0 auto" }}
      >
        <defs>
          <marker
            id="arrowhead-rnn"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={COLORS.arrow} />
          </marker>
        </defs>

        {/* Labels */}
        <text x={165} y={30} textAnchor="middle" fill={COLORS.label} fontSize={15} fontWeight={600}>
          RNN
        </text>
        <text x={165} y={48} textAnchor="middle" fill={COLORS.sublabel} fontSize={11}>
          Sequential
        </text>
        <text x={505} y={30} textAnchor="middle" fill={COLORS.label} fontSize={15} fontWeight={600}>
          Transformer
        </text>
        <text x={505} y={48} textAnchor="middle" fill={COLORS.sublabel} fontSize={11}>
          Parallel
        </text>

        {/* Divider */}
        <line x1={335} y1={20} x2={335} y2={160} stroke="#333" strokeWidth={1} strokeDasharray="4" />

        {/* RNN: sequential arrows */}
        {rnnX.slice(0, -1).map((x, i) => (
          <Arrow key={`rnn-${i}`} x1={x} y1={rnnY} x2={rnnX[i + 1]!} y2={rnnY} />
        ))}

        {/* RNN tokens */}
        {rnnX.map((x, i) => (
          <Token key={`rnn-t-${i}`} cx={x} cy={rnnY} label={tokens[i]!} />
        ))}

        {/* Transformer: all-to-all connections */}
        {pairs.map(([i, j]) => (
          <Connection
            key={`tf-${i}-${j}`}
            x1={tfX[i]!}
            y1={tfY}
            x2={tfX[j]!}
            y2={tfY}
          />
        ))}

        {/* Transformer tokens */}
        {tfX.map((x, i) => (
          <Token key={`tf-t-${i}`} cx={x} cy={tfY} label={tokens[i]!} />
        ))}

        {/* Time labels */}
        <text x={60} y={150} textAnchor="middle" fill={COLORS.sublabel} fontSize={10}>t=1</text>
        <text x={130} y={150} textAnchor="middle" fill={COLORS.sublabel} fontSize={10}>t=2</text>
        <text x={200} y={150} textAnchor="middle" fill={COLORS.sublabel} fontSize={10}>t=3</text>
        <text x={270} y={150} textAnchor="middle" fill={COLORS.sublabel} fontSize={10}>t=4</text>
        <text x={505} y={150} textAnchor="middle" fill={COLORS.sublabel} fontSize={10}>t=1 (all at once)</text>
      </svg>
    </div>
  );
}
