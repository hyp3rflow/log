"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const COLORS = {
  embedding: "#f4a0c0",
  attention: "#f0a050",
  ffn: "#6090e0",
  norm: "#e0d060",
  output: "#60c080",
  arrow: "#666",
  text: "#ccc",
  sublabel: "#888",
  bg: "#1a1a1a",
  border: "#444",
  residual: "#888",
};

export default function TransformerDecoderDiagram() {
  const W = 360;
  const H = 720;
  const cx = W / 2;
  const bw = 180;
  const bh = 36;
  const left = cx - bw / 2;

  const blocks: { y: number; label: string; color: string; sub?: string }[] = [
    { y: 660, label: "Input Embedding", color: COLORS.embedding },
    { y: 610, label: "Positional Encoding", color: COLORS.embedding, sub: "RoPE / Sinusoidal" },
    // Decoder block
    { y: 500, label: "Masked Self-Attention", color: COLORS.attention, sub: "Multi-Head / GQA" },
    { y: 450, label: "Add & Norm", color: COLORS.norm },
    { y: 390, label: "Feed-Forward Network", color: COLORS.ffn, sub: "SwiGLU / ReLU" },
    { y: 340, label: "Add & Norm", color: COLORS.norm },
    // Output
    { y: 220, label: "Layer Norm", color: COLORS.norm },
    { y: 170, label: "Linear", color: COLORS.output },
    { y: 120, label: "Softmax", color: COLORS.output },
  ];

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        Decoder-only Transformer Architecture
      </div>
      <div style={{ overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="td-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7" fill="none" stroke={COLORS.arrow} strokeWidth="1.5" />
            </marker>
            <marker id="td-arrow-res" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7" fill="none" stroke={COLORS.residual} strokeWidth="1" />
            </marker>
          </defs>

          {/* Blocks */}
          {blocks.map((b, i) => (
            <g key={i}>
              <rect
                x={left}
                y={b.y}
                width={bw}
                height={bh}
                rx={6}
                fill={b.color + "18"}
                stroke={b.color + "88"}
                strokeWidth={1.5}
              />
              <text
                x={cx}
                y={b.y + (b.sub ? 14 : 20)}
                textAnchor="middle"
                fill={b.color}
                fontSize={11}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {b.label}
              </text>
              {b.sub && (
                <text
                  x={cx}
                  y={b.y + 27}
                  textAnchor="middle"
                  fill={COLORS.sublabel}
                  fontSize={8}
                  fontFamily="system-ui, sans-serif"
                >
                  {b.sub}
                </text>
              )}
            </g>
          ))}

          {/* Vertical arrows between blocks */}
          {/* Embedding → Pos Enc */}
          <line x1={cx} y1={660} x2={cx} y2={646 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* Pos Enc → Masked Attn */}
          <line x1={cx} y1={610} x2={cx} y2={536 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* Masked Attn → Add&Norm */}
          <line x1={cx} y1={500} x2={cx} y2={486 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* Add&Norm → FFN */}
          <line x1={cx} y1={450} x2={cx} y2={426 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* FFN → Add&Norm */}
          <line x1={cx} y1={390} x2={cx} y2={376 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* Add&Norm2 → LayerNorm */}
          <line x1={cx} y1={340} x2={cx} y2={256 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* LayerNorm → Linear */}
          <line x1={cx} y1={220} x2={cx} y2={206 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
          {/* Linear → Softmax */}
          <line x1={cx} y1={170} x2={cx} y2={156 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />

          {/* Nx bracket for decoder block */}
          <rect
            x={left - 30}
            y={330}
            width={bw + 60}
            height={216}
            rx={8}
            fill="none"
            stroke="#555"
            strokeWidth={1}
            strokeDasharray="6,3"
          />
          <text
            x={left - 16}
            y={445}
            fill="#aaa"
            fontSize={14}
            fontWeight={700}
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            N×
          </text>

          {/* Residual connection: around Masked Attn (from before attn to Add&Norm) */}
          <path
            d={`M${left - 8},${556} L${left - 8},${468} L${left},${468}`}
            fill="none"
            stroke={COLORS.residual}
            strokeWidth={1}
            strokeDasharray="4,3"
            markerEnd="url(#td-arrow-res)"
          />
          <text x={left - 12} y={510} fill={COLORS.residual} fontSize={7} textAnchor="end" fontFamily="system-ui, sans-serif">
            residual
          </text>

          {/* Residual connection: around FFN (from before FFN to Add&Norm2) */}
          <path
            d={`M${left - 8},${446} L${left - 8},${358} L${left},${358}`}
            fill="none"
            stroke={COLORS.residual}
            strokeWidth={1}
            strokeDasharray="4,3"
            markerEnd="url(#td-arrow-res)"
          />

          {/* Output label */}
          <text x={cx} y={105} textAnchor="middle" fill={COLORS.output} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
            Output Probabilities
          </text>
          <line x1={cx} y1={120} x2={cx} y2={112} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />

          {/* Input label */}
          <text x={cx} y={710} textAnchor="middle" fill={COLORS.embedding} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
            Input Tokens
          </text>
          <line x1={cx} y1={700} x2={cx} y2={696 + 2} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#td-arrow)" />
        </svg>
      </div>
    </div>
  );
}
