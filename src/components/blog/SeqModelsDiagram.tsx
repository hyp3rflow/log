"use client";

const C = {
  bg: "#111",
  cell: "#1a1a1a",
  border: "#333",
  text: "#ccc",
  label: "#888",
  input: "#6eb5ff",
  hidden: "#f0a050",
  output: "#60c080",
  attention: "#c080f0",
  arrow: "#888",
  layer: "#2a2a2a",
};
const F = "system-ui, sans-serif";

/* ─────────── Shared ─────────── */
function Marker({ id }: { id: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0,0 8,3 0,6" fill={C.arrow} />
    </marker>
  );
}

function Arr({ x1, y1, x2, y2, dash }: { x1: number; y1: number; x2: number; y2: number; dash?: boolean }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={C.arrow} strokeWidth={1.2} markerEnd="url(#seq-arr)"
      strokeDasharray={dash ? "4,3" : undefined} />
  );
}

function CellBox({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={color + "15"} stroke={color + "66"} strokeWidth={1.2} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
        fill={color} fontSize={10} fontWeight={600} fontFamily={F}>
        {label}
      </text>
    </g>
  );
}

/* ─────────── RNN Full Model ─────────── */
function RNNModel() {
  const W = 480;
  const tokens = ["x₁", "x₂", "x₃", "x₄"];
  const outputs = ["y₁", "y₂", "y₃", "y₄"];
  const n = tokens.length;
  const cellW = 56;
  const cellH = 34;
  const gap = (W - 60) / n;
  const startX = 50;

  // 2 layers
  const layer1Y = 140;
  const layer2Y = 80;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, color: C.label, marginBottom: 10 }}>
        RNN — 2-Layer, 4 time steps
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} 210`} width="100%" style={{ maxWidth: W }}>
          <defs><Marker id="seq-arr" /></defs>

          {/* Layer labels */}
          <text x={12} y={layer1Y + cellH / 2 + 3} fill={C.label} fontSize={9} fontFamily={F}>Layer 1</text>
          <text x={12} y={layer2Y + cellH / 2 + 3} fill={C.label} fontSize={9} fontFamily={F}>Layer 2</text>

          {tokens.map((tok, i) => {
            const cx = startX + i * gap;

            return (
              <g key={i}>
                {/* Input */}
                <text x={cx + cellW / 2} y={195} textAnchor="middle" fill={C.input} fontSize={10} fontFamily={F}>{tok}</text>
                <Arr x1={cx + cellW / 2} y1={184} x2={cx + cellW / 2} y2={layer1Y + cellH + 2} />

                {/* Layer 1 cell */}
                <CellBox x={cx} y={layer1Y} w={cellW} h={cellH} label="RNN" color={C.hidden} />

                {/* Layer 1 → Layer 2 */}
                <Arr x1={cx + cellW / 2} y1={layer1Y - 2} x2={cx + cellW / 2} y2={layer2Y + cellH + 2} />

                {/* Layer 2 cell */}
                <CellBox x={cx} y={layer2Y} w={cellW} h={cellH} label="RNN" color={C.hidden} />

                {/* Output */}
                <text x={cx + cellW / 2} y={46} textAnchor="middle" fill={C.output} fontSize={10} fontFamily={F}>{outputs[i]}</text>
                <Arr x1={cx + cellW / 2} y1={layer2Y - 2} x2={cx + cellW / 2} y2={52} />

                {/* Horizontal arrows (h_t → h_{t+1}) in both layers */}
                {i < n - 1 && (
                  <>
                    <Arr x1={cx + cellW + 2} y1={layer1Y + cellH / 2} x2={cx + gap - 2} y2={layer1Y + cellH / 2} />
                    <Arr x1={cx + cellW + 2} y1={layer2Y + cellH / 2} x2={cx + gap - 2} y2={layer2Y + cellH / 2} />
                  </>
                )}
              </g>
            );
          })}

          {/* Time arrow */}
          <text x={W - 20} y={layer1Y + cellH + 20} fill={C.label} fontSize={9} fontFamily={F}>time →</text>
        </svg>
      </div>
      <div style={{ fontSize: 11, color: C.label, marginTop: 6 }}>
        각 time step에서 Layer 1의 hidden state가 Layer 2의 입력이 된다. 같은 layer 내에서는 이전 step의 hidden state가 순차 전달된다 — <strong style={{ color: C.text }}>병렬화 불가</strong>.
      </div>
    </div>
  );
}

/* ─────────── Seq2Seq + Attention ─────────── */
function Seq2SeqModel() {
  const W = 560;
  const encTokens = ["I", "love", "cats", "<EOS>"];
  const decTokens = ["<SOS>", "나는", "고양이를", "좋아해"];
  const decOutputs = ["나는", "고양이를", "좋아해", "<EOS>"];
  const cellW = 52;
  const cellH = 34;
  const encGap = 62;
  const decGap = 62;
  const encStartX = 30;
  const decStartX = W - 30 - (decTokens.length - 1) * decGap - cellW;

  const encY = 160;
  const decY = 160;
  const ctxY = 90;

  return (
    <div>
      <div style={{ fontSize: 13, color: C.label, marginBottom: 10 }}>
        Seq2Seq + Attention — Encoder-Decoder 구조
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} 280`} width="100%" style={{ maxWidth: W }}>
          <defs><Marker id="seq-arr" /></defs>

          {/* Encoder label */}
          <rect x={encStartX - 8} y={encY - 12} width={encTokens.length * encGap + 8} height={cellH + 24}
            rx={8} fill="none" stroke={C.hidden + "33"} strokeWidth={1} strokeDasharray="6,3" />
          <text x={encStartX + (encTokens.length * encGap) / 2} y={encY - 20}
            textAnchor="middle" fill={C.hidden} fontSize={11} fontWeight={600} fontFamily={F}>
            Encoder (Bidirectional LSTM)
          </text>

          {/* Encoder cells */}
          {encTokens.map((tok, i) => {
            const cx = encStartX + i * encGap;
            return (
              <g key={`enc-${i}`}>
                <text x={cx + cellW / 2} y={230} textAnchor="middle" fill={C.input} fontSize={10} fontFamily={F}>{tok}</text>
                <Arr x1={cx + cellW / 2} y1={218} x2={cx + cellW / 2} y2={encY + cellH + 2} />
                <CellBox x={cx} y={encY} w={cellW} h={cellH} label="LSTM" color={C.hidden} />
                {i < encTokens.length - 1 && (
                  <Arr x1={cx + cellW + 2} y1={encY + cellH / 2} x2={cx + encGap - 2} y2={encY + cellH / 2} />
                )}
              </g>
            );
          })}

          {/* Decoder label */}
          <rect x={decStartX - 8} y={decY - 12} width={decTokens.length * decGap + 8} height={cellH + 24}
            rx={8} fill="none" stroke={C.output + "33"} strokeWidth={1} strokeDasharray="6,3" />
          <text x={decStartX + (decTokens.length * decGap) / 2} y={decY - 20}
            textAnchor="middle" fill={C.output} fontSize={11} fontWeight={600} fontFamily={F}>
            Decoder (LSTM + Attention)
          </text>

          {/* Decoder cells */}
          {decTokens.map((tok, i) => {
            const cx = decStartX + i * decGap;
            return (
              <g key={`dec-${i}`}>
                <text x={cx + cellW / 2} y={230} textAnchor="middle" fill={C.input} fontSize={9} fontFamily={F}>{tok}</text>
                <Arr x1={cx + cellW / 2} y1={218} x2={cx + cellW / 2} y2={decY + cellH + 2} />
                <CellBox x={cx} y={decY} w={cellW} h={cellH} label="LSTM" color={C.output} />
                {/* Output */}
                <text x={cx + cellW / 2} y={46} textAnchor="middle" fill={C.text} fontSize={9} fontFamily={F}>{decOutputs[i]}</text>
                <Arr x1={cx + cellW / 2} y1={decY - 2} x2={cx + cellW / 2} y2={ctxY + 20} />
                {i < decTokens.length - 1 && (
                  <Arr x1={cx + cellW + 2} y1={decY + cellH / 2} x2={cx + decGap - 2} y2={decY + cellH / 2} />
                )}
              </g>
            );
          })}

          {/* Attention context box */}
          <rect x={decStartX} y={ctxY} width={decTokens.length * decGap - decGap + cellW} height={20}
            rx={4} fill={C.attention + "15"} stroke={C.attention + "55"} strokeWidth={1} />
          <text x={decStartX + (decTokens.length * decGap - decGap + cellW) / 2} y={ctxY + 13}
            textAnchor="middle" fill={C.attention} fontSize={9} fontWeight={600} fontFamily={F}>
            Context (Attention-weighted sum of encoder states)
          </text>

          {/* Attention arrows: encoder cells → context */}
          {encTokens.map((_, i) => {
            const ex = encStartX + i * encGap + cellW / 2;
            const ctxMid = decStartX + (decTokens.length * decGap - decGap + cellW) / 2;
            return (
              <line key={`att-${i}`}
                x1={ex} y1={encY - 2} x2={ctxMid} y2={ctxY + 20}
                stroke={C.attention} strokeWidth={0.8} opacity={0.3}
                strokeDasharray="3,2" />
            );
          })}

          {/* Decoder output arrows */}
          {decTokens.map((_, i) => {
            const cx = decStartX + i * decGap + cellW / 2;
            return (
              <Arr key={`out-${i}`} x1={cx} y1={ctxY - 2} x2={cx} y2={52} />
            );
          })}

          {/* Separator */}
          <line x1={W / 2 - 10} y1={encY - 30} x2={W / 2 - 10} y2={245}
            stroke="#2a2a2a" strokeWidth={1} strokeDasharray="6,4" />
        </svg>
      </div>
      <div style={{ fontSize: 11, color: C.label, marginTop: 6 }}>
        Encoder가 입력 시퀀스를 처리한 뒤, Decoder가 매 step마다 Encoder의 <strong style={{ color: C.attention }}>모든 hidden state를 attention으로 참조</strong>하여 출력을 생성한다. 그러나 Encoder와 Decoder 모두 <strong style={{ color: C.text }}>LSTM 기반이라 순차 처리</strong>를 벗어나지 못한다.
      </div>
    </div>
  );
}

export default function SeqModelsDiagram() {
  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      background: C.bg,
      padding: 24,
      margin: "2rem 0",
    }}>
      <RNNModel />
      <Seq2SeqModel />
    </div>
  );
}
