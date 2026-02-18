"use client";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const projects = [
  { name: "project-a", x: 80, color: "#6cf" },
  { name: "project-b", x: 300, color: "#9c6" },
  { name: "project-c", x: 520, color: "#f96" },
];

const casPackages = [
  { name: "lodash@4.17.21", hash: "a1b2c3...", y: 180 },
  { name: "react@19.2.3", hash: "d4e5f6...", y: 220 },
  { name: "typescript@5.7", hash: "g7h8i9...", y: 260 },
];

export default function CASExplainer() {
  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>Content-Addressable Store — 3개 프로젝트가 동일 패키지를 공유</div>

      <svg viewBox="0 0 680 320" width="100%" style={{ maxWidth: 680 }}>
        {/* Projects */}
        {projects.map((p) => (
          <g key={p.name}>
            <rect x={p.x} y={20} width={100} height={36} rx={6} fill="#1a1a1a" stroke={p.color} strokeWidth={1.5} />
            <text x={p.x + 50} y={42} textAnchor="middle" fill={p.color} fontSize={11} fontFamily="inherit">{p.name}</text>
          </g>
        ))}

        {/* CAS Store box */}
        <rect x={40} y={140} width={600} height={140} rx={8} fill="#0a0a1a" stroke="#334" strokeWidth={1} strokeDasharray="4,4" />
        <text x={60} y={165} fill="#556" fontSize={11} fontFamily="inherit">~/.pnpm-store/v3/files/</text>

        {/* CAS entries */}
        {casPackages.map((pkg) => (
          <g key={pkg.name}>
            <rect x={180} y={pkg.y - 14} width={320} height={28} rx={4} fill="#1a1a2a" stroke="#334" />
            <text x={200} y={pkg.y + 2} fill="#aab" fontSize={11} fontFamily="'SF Mono', monospace">{pkg.hash}</text>
            <text x={350} y={pkg.y + 2} fill="#778" fontSize={11} fontFamily="inherit">{pkg.name}</text>
          </g>
        ))}

        {/* Hard link arrows from projects to CAS */}
        {projects.map((p) => (
          <g key={p.name + "-links"}>
            {casPackages.map((pkg) => (
              <line
                key={`${p.name}-${pkg.name}`}
                x1={p.x + 50} y1={56}
                x2={340} y2={pkg.y - 14}
                stroke={p.color} strokeWidth={0.7} opacity={0.4}
                strokeDasharray="3,3"
              />
            ))}
          </g>
        ))}

        <text x={340} y={308} textAnchor="middle" fill="#556" fontSize={10} fontFamily="inherit">
          하드 링크: 디스크에 파일 1카피 → 3개 프로젝트에서 공유
        </text>
      </svg>

      {/* Disk usage comparison */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>디스크 사용량 비교 (동일 패키지 3개 프로젝트)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "#999", width: "70px" }}>npm flat</span>
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "4px", height: "20px", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #f44, #f66)", borderRadius: "4px", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                <span style={{ fontSize: "10px", color: "#fff" }}>300 MB (3x 복사)</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "#999", width: "70px" }}>pnpm CAS</span>
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "4px", height: "20px", overflow: "hidden" }}>
              <div style={{ width: "33%", height: "100%", background: "linear-gradient(90deg, #4c8, #6ea)", borderRadius: "4px", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                <span style={{ fontSize: "10px", color: "#fff" }}>100 MB (1카피 + 하드링크)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
