"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const C = {
  dram: "#6eb5ff",
  tsv: "#f0a050",
  bump: "#c080f0",
  interposer: "#60c080",
  substrate: "#a0a0a0",
  gpu: "#f06070",
  gddr: "#f9c74f",
  pcb: "#8a8a6a",
  text: "#ccc",
  label: "#777",
};

function GDDRSide() {
  const ox = 20; // offset x
  const baseY = 220;

  return (
    <g>
      <text x={150} y={24} textAnchor="middle" fill={C.text} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
        GDDR (Conventional)
      </text>

      {/* PCB Board */}
      <rect x={ox} y={baseY} width={260} height={28} rx={3} fill={C.pcb + "22"} stroke={C.pcb} strokeWidth={1} />
      <text x={ox + 130} y={baseY + 17} textAnchor="middle" fill={C.pcb} fontSize={9} fontFamily="system-ui, sans-serif">
        PCB (Wide Bus Traces)
      </text>

      {/* GPU */}
      <rect x={ox + 20} y={baseY - 55} width={90} height={45} rx={5} fill={C.gpu + "22"} stroke={C.gpu} strokeWidth={1.5} />
      <text x={ox + 65} y={baseY - 28} textAnchor="middle" fill={C.gpu} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">GPU</text>

      {/* GDDR chip */}
      <rect x={ox + 145} y={baseY - 55} width={90} height={45} rx={5} fill={C.gddr + "22"} stroke={C.gddr} strokeWidth={1.5} />
      <text x={ox + 190} y={baseY - 35} textAnchor="middle" fill={C.gddr} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">GDDR6</text>
      <text x={ox + 190} y={baseY - 20} textAnchor="middle" fill={C.label} fontSize={8} fontFamily="system-ui, sans-serif">Single Die</text>

      {/* Bus traces between GPU and GDDR */}
      {[0, 8, 16, 24, 32].map((off) => (
        <line key={off} x1={ox + 110} y1={baseY - 32 + off * 0.4}
          x2={ox + 145} y2={baseY - 32 + off * 0.4}
          stroke={C.pcb} strokeWidth={1} opacity={0.4} />
      ))}
      <text x={ox + 128} y={baseY - 60} textAnchor="middle" fill={C.label} fontSize={8} fontFamily="system-ui, sans-serif">
        32-bit bus
      </text>

      {/* Solder balls to PCB */}
      {[40, 60, 80, 160, 180, 200].map((xp) => (
        <circle key={xp} cx={ox + xp} cy={baseY - 4} r={2.5} fill={C.bump + "66"} stroke={C.bump} strokeWidth={0.5} />
      ))}

      {/* Bandwidth label */}
      <rect x={ox + 20} y={baseY + 42} width={220} height={26} rx={6} fill="#1a1a1a" stroke="#333" strokeWidth={0.5} />
      <text x={ox + 130} y={baseY + 59} textAnchor="middle" fill={C.gddr} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        ~900 GB/s (GDDR6X, 384-bit)
      </text>
    </g>
  );
}

function HBMSide() {
  const ox = 340;
  const baseY = 220;
  const numDies = 8;
  const dieH = 14;
  const dieGap = 2;
  const stackW = 80;
  const stackX = ox + 145;

  return (
    <g>
      <text x={ox + 150} y={24} textAnchor="middle" fill={C.text} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
        HBM (3D Stacked)
      </text>

      {/* Package Substrate */}
      <rect x={ox} y={baseY} width={300} height={28} rx={3} fill={C.substrate + "22"} stroke={C.substrate} strokeWidth={1} />
      <text x={ox + 150} y={baseY + 17} textAnchor="middle" fill={C.substrate} fontSize={9} fontFamily="system-ui, sans-serif">
        Package Substrate
      </text>

      {/* Silicon Interposer */}
      <rect x={ox + 10} y={baseY - 22} width={280} height={16} rx={2} fill={C.interposer + "22"} stroke={C.interposer} strokeWidth={1} />
      <text x={ox + 150} y={baseY - 11} textAnchor="middle" fill={C.interposer} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">
        Silicon Interposer
      </text>

      {/* GPU on interposer */}
      <rect x={ox + 20} y={baseY - 76} width={100} height={48} rx={5} fill={C.gpu + "22"} stroke={C.gpu} strokeWidth={1.5} />
      <text x={ox + 70} y={baseY - 48} textAnchor="middle" fill={C.gpu} fontSize={11} fontWeight={600} fontFamily="system-ui, sans-serif">GPU</text>

      {/* Micro bumps under GPU */}
      {[0, 14, 28, 42, 56, 70].map((off) => (
        <circle key={`gb-${off}`} cx={ox + 35 + off} cy={baseY - 25} r={2} fill={C.bump + "66"} stroke={C.bump} strokeWidth={0.5} />
      ))}

      {/* HBM Stack - DRAM dies */}
      {Array.from({ length: numDies }, (_, i) => {
        const dy = baseY - 28 - (i + 1) * (dieH + dieGap);
        return (
          <rect key={i} x={stackX} y={dy} width={stackW} height={dieH} rx={2}
            fill={C.dram + "18"} stroke={C.dram + "66"} strokeWidth={0.8} />
        );
      })}

      {/* Stack label on top */}
      <text x={stackX + stackW / 2} y={baseY - 28 - numDies * (dieH + dieGap) - 8}
        textAnchor="middle" fill={C.dram} fontSize={9} fontWeight={600} fontFamily="system-ui, sans-serif">
        8-Hi DRAM Stack
      </text>

      {/* TSV lines through stack */}
      {[20, 40, 60].map((off) => (
        <line key={off}
          x1={stackX + off} y1={baseY - 25}
          x2={stackX + off} y2={baseY - 28 - numDies * (dieH + dieGap) + dieH}
          stroke={C.tsv} strokeWidth={1.2} strokeDasharray="3,2" opacity={0.7} />
      ))}

      {/* Micro bumps under HBM stack */}
      {[0, 14, 28, 42, 56].map((off) => (
        <circle key={`hb-${off}`} cx={stackX + 12 + off} cy={baseY - 25} r={2} fill={C.bump + "66"} stroke={C.bump} strokeWidth={0.5} />
      ))}

      {/* Labels */}
      <g>
        {/* TSV label */}
        <line x1={stackX + stackW + 4} y1={baseY - 100} x2={stackX + stackW + 14} y2={baseY - 100} stroke={C.tsv} strokeWidth={0.8} />
        <text x={stackX + stackW + 17} y={baseY - 97} fill={C.tsv} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">TSV</text>

        {/* Micro Bump label */}
        <line x1={stackX + stackW + 4} y1={baseY - 25} x2={stackX + stackW + 14} y2={baseY - 25} stroke={C.bump} strokeWidth={0.8} />
        <text x={stackX + stackW + 17} y={baseY - 22} fill={C.bump} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">Micro Bump</text>
      </g>

      {/* 1024-bit label on interposer between GPU and HBM */}
      <text x={ox + 120} y={baseY - 30} textAnchor="middle" fill={C.interposer} fontSize={7} fontFamily="system-ui, sans-serif">
        1024-bit
      </text>

      {/* Bandwidth label */}
      <rect x={ox + 40} y={baseY + 42} width={220} height={26} rx={6} fill="#1a1a1a" stroke="#333" strokeWidth={0.5} />
      <text x={ox + 150} y={baseY + 59} textAnchor="middle" fill={C.interposer} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        ~3,350 GB/s (HBM3, H100)
      </text>
    </g>
  );
}

export default function HBMStackDiagram() {
  const totalW = 660;
  const totalH = 300;

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        GDDR vs HBM — Memory Architecture Cross-Section
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: totalW }}>
          {/* Divider */}
          <line x1={325} y1={10} x2={325} y2={totalH - 10} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="6,4" />
          <GDDRSide />
          <HBMSide />
        </svg>
      </div>
    </div>
  );
}
