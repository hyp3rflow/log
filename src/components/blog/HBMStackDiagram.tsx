"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const COLORS = {
  dram: "#6eb5ff",
  tsv: "#f0a050",
  bump: "#c080f0",
  interposer: "#60c080",
  substrate: "#a0a0a0",
  gpu: "#f06070",
  gddr: "#f9c74f",
  pcb: "#8a8a6a",
  text: "#ccc",
  label: "#888",
};

function GDDRSection() {
  const x = 20;
  const baseY = 260;

  return (
    <g>
      <text x={160} y={20} textAnchor="middle" fill={COLORS.text} fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
        GDDR (Conventional)
      </text>

      {/* PCB */}
      <rect x={x} y={baseY} width={280} height={30} rx={3} fill={COLORS.pcb + "33"} stroke={COLORS.pcb} strokeWidth={1} />
      <text x={160} y={baseY + 19} textAnchor="middle" fill={COLORS.pcb} fontSize={9} fontFamily="system-ui, sans-serif">
        PCB (Wide Bus Traces)
      </text>

      {/* GPU die */}
      <rect x={x + 20} y={baseY - 50} width={80} height={40} rx={4} fill={COLORS.gpu + "22"} stroke={COLORS.gpu} strokeWidth={1.5} />
      <text x={x + 60} y={baseY - 26} textAnchor="middle" fill={COLORS.gpu} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        GPU
      </text>

      {/* GDDR chip */}
      <rect x={x + 160} y={baseY - 50} width={80} height={40} rx={4} fill={COLORS.gddr + "22"} stroke={COLORS.gddr} strokeWidth={1.5} />
      <text x={x + 200} y={baseY - 32} textAnchor="middle" fill={COLORS.gddr} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        GDDR6
      </text>
      <text x={x + 200} y={baseY - 18} textAnchor="middle" fill={COLORS.label} fontSize={7} fontFamily="system-ui, sans-serif">
        Single Die
      </text>

      {/* Bus lines */}
      {[0, 6, 12, 18].map((offset) => (
        <line
          key={offset}
          x1={x + 100 + offset}
          y1={baseY - 30}
          x2={x + 160}
          y2={baseY - 30}
          stroke={COLORS.pcb}
          strokeWidth={0.8}
          opacity={0.5}
        />
      ))}
      <text x={x + 140} y={baseY - 38} textAnchor="middle" fill={COLORS.label} fontSize={7} fontFamily="system-ui, sans-serif">
        32-bit bus
      </text>

      {/* Bandwidth */}
      <rect x={x + 60} y={baseY + 45} width={200} height={24} rx={6} fill="#222" stroke="#444" strokeWidth={0.5} />
      <text x={x + 160} y={baseY + 61} textAnchor="middle" fill={COLORS.gddr} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        ~900 GB/s (GDDR6X, 384-bit)
      </text>
    </g>
  );
}

function HBMSection() {
  const x = 340;
  const baseY = 260;
  const dramH = 16;
  const dramGap = 2;
  const numDies = 8;
  const stackW = 70;
  const stackX = x + 140;

  return (
    <g>
      <text x={x + 140} y={20} textAnchor="middle" fill={COLORS.text} fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">
        HBM (3D Stacked)
      </text>

      {/* Package Substrate */}
      <rect x={x} y={baseY} width={280} height={30} rx={3} fill={COLORS.substrate + "33"} stroke={COLORS.substrate} strokeWidth={1} />
      <text x={x + 140} y={baseY + 19} textAnchor="middle" fill={COLORS.substrate} fontSize={9} fontFamily="system-ui, sans-serif">
        Package Substrate
      </text>

      {/* Silicon Interposer */}
      <rect x={x + 10} y={baseY - 20} width={260} height={14} rx={2} fill={COLORS.interposer + "22"} stroke={COLORS.interposer} strokeWidth={1} />
      <text x={x + 140} y={baseY - 10} textAnchor="middle" fill={COLORS.interposer} fontSize={7} fontFamily="system-ui, sans-serif">
        Silicon Interposer
      </text>

      {/* GPU die on interposer */}
      <rect x={x + 20} y={baseY - 75} width={80} height={50} rx={4} fill={COLORS.gpu + "22"} stroke={COLORS.gpu} strokeWidth={1.5} />
      <text x={x + 60} y={baseY - 46} textAnchor="middle" fill={COLORS.gpu} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        GPU
      </text>

      {/* Micro bumps under GPU */}
      {[0, 12, 24, 36, 48, 60].map((offset) => (
        <rect key={`gb-${offset}`} x={x + 28 + offset} y={baseY - 24} width={6} height={3} rx={1} fill={COLORS.bump + "66"} stroke={COLORS.bump} strokeWidth={0.5} />
      ))}

      {/* HBM Stack */}
      {/* Micro bumps at bottom of stack */}
      {[0, 12, 24, 36, 48].map((offset) => (
        <rect key={`hb-${offset}`} x={stackX + 8 + offset} y={baseY - 24} width={6} height={3} rx={1} fill={COLORS.bump + "66"} stroke={COLORS.bump} strokeWidth={0.5} />
      ))}

      {/* DRAM dies stacked */}
      {Array.from({ length: numDies }, (_, i) => {
        const dy = baseY - 30 - (i + 1) * (dramH + dramGap);
        return (
          <g key={`dram-${i}`}>
            <rect x={stackX} y={dy} width={stackW} height={dramH} rx={2} fill={COLORS.dram + "18"} stroke={COLORS.dram + "88"} strokeWidth={0.8} />
            {i === numDies - 1 && (
              <text x={stackX + stackW / 2} y={dy + 11} textAnchor="middle" fill={COLORS.dram} fontSize={7} fontFamily="system-ui, sans-serif">
                DRAM Die
              </text>
            )}
          </g>
        );
      })}

      {/* TSV lines through stack */}
      {[15, 35, 55].map((offset) => (
        <line
          key={`tsv-${offset}`}
          x1={stackX + offset}
          y1={baseY - 28}
          x2={stackX + offset}
          y2={baseY - 30 - numDies * (dramH + dramGap)}
          stroke={COLORS.tsv}
          strokeWidth={1}
          strokeDasharray="3,2"
          opacity={0.7}
        />
      ))}

      {/* Labels with lines */}
      {/* TSV label */}
      <text x={stackX + stackW + 14} y={baseY - 100} fill={COLORS.tsv} fontSize={7} fontWeight={600} fontFamily="system-ui, sans-serif">
        TSV
      </text>
      <line x1={stackX + stackW + 4} y1={baseY - 103} x2={stackX + stackW + 12} y2={baseY - 103} stroke={COLORS.tsv} strokeWidth={0.5} />

      {/* Micro Bump label */}
      <text x={stackX + stackW + 14} y={baseY - 20} fill={COLORS.bump} fontSize={7} fontWeight={600} fontFamily="system-ui, sans-serif">
        Micro Bump
      </text>

      {/* Stack label */}
      <text x={stackX + stackW / 2} y={baseY - 30 - numDies * (dramH + dramGap) - 6} textAnchor="middle" fill={COLORS.dram} fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif">
        8-Hi Stack
      </text>

      {/* 1024-bit label between GPU and HBM on interposer */}
      <text x={x + 115} y={baseY - 28} textAnchor="middle" fill={COLORS.interposer} fontSize={7} fontFamily="system-ui, sans-serif">
        1024-bit
      </text>

      {/* Bandwidth */}
      <rect x={x + 40} y={baseY + 45} width={200} height={24} rx={6} fill="#222" stroke="#444" strokeWidth={0.5} />
      <text x={x + 140} y={baseY + 61} textAnchor="middle" fill={COLORS.interposer} fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
        ~3,350 GB/s (HBM3, H100)
      </text>
    </g>
  );
}

export default function HBMStackDiagram() {
  const totalW = 640;
  const totalH = 310;

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        GDDR vs HBM — Memory Architecture Cross-Section
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: totalW }}>
          {/* Divider */}
          <line x1={320} y1={10} x2={320} y2={totalH - 10} stroke="#333" strokeWidth={1} strokeDasharray="6,4" />

          <GDDRSection />
          <HBMSection />
        </svg>
      </div>
    </div>
  );
}
