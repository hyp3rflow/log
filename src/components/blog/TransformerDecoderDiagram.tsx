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
  text: "#ccc",
  sublabel: "#888",
  arrow: "#888",
  residual: "#666",
};

interface Block {
  label: string;
  sub?: string;
  color: string;
}

const blocks: Block[] = [
  { label: "Softmax", color: COLORS.output },
  { label: "Linear", color: COLORS.output },
  { label: "Layer Norm", color: COLORS.norm },
  // -- gap for Nx bracket --
  { label: "Add & Norm", color: COLORS.norm },
  { label: "Feed-Forward Network", sub: "SwiGLU / ReLU", color: COLORS.ffn },
  { label: "Add & Norm", color: COLORS.norm },
  { label: "Masked Self-Attention", sub: "Multi-Head / GQA", color: COLORS.attention },
  // -- gap for Nx bracket --
  { label: "Positional Encoding", sub: "RoPE / Sinusoidal", color: COLORS.embedding },
  { label: "Input Embedding", color: COLORS.embedding },
];

const legends: { label: string; color: string; desc: string }[] = [
  { label: "Input Embedding", color: COLORS.embedding, desc: "토큰 ID를 d차원 벡터로 변환. 어휘 크기 V × hidden dim d의 가중치 행렬." },
  { label: "Positional Encoding", color: COLORS.embedding, desc: "토큰의 순서 정보를 주입. RoPE는 Q·K에 회전 행렬을 적용해 상대 위치를 인코딩한다." },
  { label: "Masked Self-Attention", color: COLORS.attention, desc: "각 토큰이 이전 토큰들만 참조. Q·Kᵀ로 attention score를 구하고, V를 가중합한다. 추론 시 이전 토큰의 K·V를 재사용하는 것이 KV Cache." },
  { label: "Feed-Forward Network", color: COLORS.ffn, desc: "토큰별 독립적인 2-layer MLP. 최신 모델은 SwiGLU 활성화를 사용하며, hidden dim의 약 2.7배로 확장 후 축소." },
  { label: "Add & Norm", color: COLORS.norm, desc: "Residual connection + Layer Normalization. 입력을 그대로 더해(skip connection) 그래디언트 소실을 방지." },
  { label: "Linear → Softmax", color: COLORS.output, desc: "hidden state를 어휘 크기 V로 투영 후 확률 분포로 변환. 다음 토큰을 예측한다." },
];

export default function TransformerDecoderDiagram() {
  const W = 380;
  const bw = 200;
  const bh = 38;
  const cx = W / 2;
  const left = cx - bw / 2;

  // Layout: compute y positions top-to-bottom
  const gap = 14; // normal gap between blocks
  const bracketGapTop = 28; // gap after Layer Norm before Nx block
  const bracketGapBottom = 28; // gap after Nx block before Pos Enc
  const topPad = 50; // space for "Output Probabilities" label

  const yPositions: number[] = [];
  let y = topPad;
  for (let i = 0; i < blocks.length; i++) {
    yPositions.push(y);
    y += bh;
    if (i === 2) y += bracketGapTop; // after Layer Norm
    else if (i === 6) y += bracketGapBottom; // after Masked Self-Attention
    else y += gap;
  }

  const totalH = y + 50; // space for "Input Tokens" label

  // Nx bracket around blocks 3-6 (Add&Norm, FFN, Add&Norm, Masked Self-Attention)
  const nxTop = yPositions[3]! - 8;
  const nxBottom = yPositions[6]! + bh + 8;
  const nxLeft = left - 28;
  const nxRight = left + bw + 28;

  // Residual connections: around Masked Attn (block 6) and around FFN (block 4)
  // Residual 1: from before block 6 (Masked Attn) to block 5 (Add & Norm after Attn)
  // Residual 2: from before block 4 (FFN) to block 3 (Add & Norm after FFN)

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        Decoder-only Transformer Architecture
      </div>
      <div style={{ overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ maxWidth: W }}>
          <defs>
            <marker id="tdd-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0,0 10,3.5 0,7" fill={COLORS.arrow} />
            </marker>
            <marker id="tdd-arrow-up" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto-start-reverse">
              <polygon points="0,0 10,3.5 0,7" fill={COLORS.arrow} />
            </marker>
            <marker id="tdd-res" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill={COLORS.residual} />
            </marker>
          </defs>

          {/* Output Probabilities label */}
          <text x={cx} y={24} textAnchor="middle" fill={COLORS.output} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
            Output Probabilities
          </text>
          <line x1={cx} y1={yPositions[0]!} x2={cx} y2={32} stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#tdd-arrow)" />

          {/* Blocks */}
          {blocks.map((b, i) => (
            <g key={i}>
              <rect
                x={left} y={yPositions[i]!} width={bw} height={bh} rx={6}
                fill={b.color + "18"} stroke={b.color + "88"} strokeWidth={1.5}
              />
              <text
                x={cx} y={yPositions[i]! + (b.sub ? 16 : 22)}
                textAnchor="middle" fill={b.color} fontSize={11} fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {b.label}
              </text>
              {b.sub && (
                <text
                  x={cx} y={yPositions[i]! + 29}
                  textAnchor="middle" fill={COLORS.sublabel} fontSize={8}
                  fontFamily="system-ui, sans-serif"
                >
                  {b.sub}
                </text>
              )}
            </g>
          ))}

          {/* Arrows between consecutive blocks (pointing upward: data flows bottom→top) */}
          {blocks.map((_, i) => {
            if (i >= blocks.length - 1) return null;
            const y1 = yPositions[i + 1]!;    // top of lower block
            const y2 = yPositions[i]! + bh;   // bottom of upper block
            if (y1 - y2 < 4) return null;
            return (
              <line key={`arr-${i}`}
                x1={cx} y1={y1} x2={cx} y2={y2}
                stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#tdd-arrow)"
              />
            );
          })}

          {/* Nx bracket */}
          <rect
            x={nxLeft} y={nxTop} width={nxRight - nxLeft} height={nxBottom - nxTop}
            rx={8} fill="none" stroke="#555" strokeWidth={1} strokeDasharray="6,3"
          />
          <text
            x={nxLeft - 4} y={(nxTop + nxBottom) / 2 + 5}
            fill="#aaa" fontSize={15} fontWeight={700} textAnchor="end"
            fontFamily="system-ui, sans-serif"
          >
            N×
          </text>

          {/* Residual connection around Masked Self-Attention: bypasses Attn, feeds into Add&Norm */}
          {(() => {
            const resX = left + bw + 14;
            const bottomY = yPositions[6]! + bh / 2;  // mid of Masked Attn (lower)
            const topY = yPositions[5]! + bh / 2;     // mid of Add & Norm (upper)
            return (
              <g>
                <path
                  d={`M${left + bw},${bottomY} L${resX},${bottomY} L${resX},${topY} L${left + bw},${topY}`}
                  fill="none" stroke={COLORS.residual} strokeWidth={1} strokeDasharray="4,3"
                  markerEnd="url(#tdd-res)"
                />
                <text x={resX + 4} y={(bottomY + topY) / 2 + 3} fill={COLORS.residual} fontSize={7} fontFamily="system-ui, sans-serif">
                  residual
                </text>
              </g>
            );
          })()}

          {/* Residual connection around FFN: bypasses FFN, feeds into Add&Norm */}
          {(() => {
            const resX = left + bw + 14;
            const bottomY = yPositions[4]! + bh / 2;  // mid of FFN (lower)
            const topY = yPositions[3]! + bh / 2;     // mid of Add & Norm (upper)
            return (
              <path
                d={`M${left + bw},${bottomY} L${resX},${bottomY} L${resX},${topY} L${left + bw},${topY}`}
                fill="none" stroke={COLORS.residual} strokeWidth={1} strokeDasharray="4,3"
                markerEnd="url(#tdd-res)"
              />
            );
          })()}

          {/* Input Tokens label */}
          <text x={cx} y={totalH - 10} textAnchor="middle" fill={COLORS.embedding} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
            Input Tokens
          </text>
          <line
            x1={cx} y1={totalH - 20} x2={cx} y2={yPositions[blocks.length - 1]! + bh}
            stroke={COLORS.arrow} strokeWidth={1.5} markerEnd="url(#tdd-arrow)"
          />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {legends.map((l) => (
          <div key={l.label} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{
              minWidth: "8px", width: "8px", height: "8px", borderRadius: "2px",
              background: l.color + "44", border: `1.5px solid ${l.color}88`,
              marginTop: "4px",
            }} />
            <div>
              <span style={{ color: l.color, fontSize: "12px", fontWeight: 600 }}>{l.label}</span>
              <span style={{ color: "#888", fontSize: "12px" }}> — {l.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
