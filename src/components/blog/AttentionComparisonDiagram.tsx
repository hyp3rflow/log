"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const COLORS = {
  q: "#6eb5ff",
  kv: "#f0a050",
  line: "#888",
  text: "#ccc",
  bar100: "#f06060",
  bar25: "#f0a050",
  bar12: "#60c080",
};

interface Section {
  title: string;
  subtitle: string;
  qCount: number;
  kvCount: number;
  barPct: number;
  barLabel: string;
  barColor: string;
}

const sections: Section[] = [
  { title: "MHA", subtitle: "Multi-Head Attention", qCount: 8, kvCount: 8, barPct: 100, barLabel: "100%", barColor: COLORS.bar100 },
  { title: "GQA", subtitle: "Grouped-Query Attention", qCount: 8, kvCount: 2, barPct: 25, barLabel: "25%", barColor: COLORS.bar25 },
  { title: "MQA", subtitle: "Multi-Query Attention", qCount: 8, kvCount: 1, barPct: 12.5, barLabel: "12.5%", barColor: COLORS.bar12 },
];

function HeadSection({ section, offsetX, sectionW }: { section: Section; offsetX: number; sectionW: number; }) {
  const cx = offsetX + sectionW / 2;
  const headR = 11;
  const qY = 70;
  const kvY = 155;
  const pad = 20;
  const usableW = sectionW - pad * 2;
  const qSpacing = section.qCount > 1 ? usableW / (section.qCount - 1) : 0;
  const kvSpacing = section.kvCount > 1 ? usableW / (section.kvCount - 1) : 0;

  const qPositions = Array.from({ length: section.qCount }, (_, i) =>
    section.qCount === 1 ? cx : offsetX + pad + qSpacing * i
  );
  const kvPositions = Array.from({ length: section.kvCount }, (_, i) =>
    section.kvCount === 1 ? cx : offsetX + pad + kvSpacing * i
  );

  // Group mapping
  const groupSize = section.qCount / section.kvCount;
  const lines: { x1: number; x2: number }[] = [];
  for (let kv = 0; kv < section.kvCount; kv++) {
    for (let q = kv * groupSize; q < (kv + 1) * groupSize; q++) {
      lines.push({ x1: qPositions[q]!, x2: kvPositions[kv]! });
    }
  }

  // Bar chart
  const barY = 210;
  const barMaxW = sectionW - 40;
  const barH = 20;
  const barX = offsetX + 20;

  return (
    <g>
      {/* Title */}
      <text x={cx} y={22} textAnchor="middle" fill={COLORS.text} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
        {section.title}
      </text>
      <text x={cx} y={38} textAnchor="middle" fill="#666" fontSize={9} fontFamily="system-ui, sans-serif">
        {section.subtitle}
      </text>

      {/* Q label */}
      <text x={offsetX + 6} y={qY + 4} fill={COLORS.q} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">Q</text>
      {/* KV label */}
      <text x={offsetX + 6} y={kvY + 4} fill={COLORS.kv} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">KV</text>

      {/* Mapping lines (behind circles) */}
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={qY + headR + 2} x2={l.x2} y2={kvY - headR - 2}
          stroke={COLORS.line} strokeWidth={1} opacity={0.5} />
      ))}

      {/* Q heads */}
      {qPositions.map((x, i) => (
        <g key={`q-${i}`}>
          <circle cx={x} cy={qY} r={headR} fill={COLORS.q + "22"} stroke={COLORS.q} strokeWidth={1.5} />
          <text x={x} y={qY + 4} textAnchor="middle" fill={COLORS.q} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">
            {i}
          </text>
        </g>
      ))}

      {/* KV heads */}
      {kvPositions.map((x, i) => (
        <g key={`kv-${i}`}>
          <circle cx={x} cy={kvY} r={headR} fill={COLORS.kv + "22"} stroke={COLORS.kv} strokeWidth={1.5} />
          <text x={x} y={kvY + 4} textAnchor="middle" fill={COLORS.kv} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">
            {i}
          </text>
        </g>
      ))}

      {/* KV Cache bar */}
      <text x={cx} y={barY - 6} textAnchor="middle" fill="#777" fontSize={9} fontFamily="system-ui, sans-serif">
        KV Cache Size
      </text>
      <rect x={barX} y={barY} width={barMaxW} height={barH} rx={4} fill="#1a1a1a" stroke="#333" strokeWidth={0.5} />
      <rect x={barX} y={barY} width={barMaxW * section.barPct / 100} height={barH} rx={4}
        fill={section.barColor + "44"} stroke={section.barColor} strokeWidth={1.2} />
      <text
        x={Math.max(barX + barMaxW * section.barPct / 100 / 2, barX + 20)}
        y={barY + 14} textAnchor="middle" fill={section.barColor}
        fontSize={10} fontWeight={700} fontFamily="system-ui, sans-serif"
      >
        {section.barLabel}
      </text>
    </g>
  );
}

export default function AttentionComparisonDiagram() {
  const sectionW = 220;
  const totalW = sectionW * 3;
  const totalH = 250;

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        MHA vs GQA vs MQA — Head Mapping &amp; KV Cache Comparison
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: totalW }}>
          {/* Separator lines */}
          <line x1={sectionW} y1={10} x2={sectionW} y2={totalH - 10} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={sectionW * 2} y1={10} x2={sectionW * 2} y2={totalH - 10} stroke="#2a2a2a" strokeWidth={1} />

          {sections.map((s, i) => (
            <HeadSection key={s.title} section={s} offsetX={i * sectionW} sectionW={sectionW} />
          ))}
        </svg>
      </div>
    </div>
  );
}
