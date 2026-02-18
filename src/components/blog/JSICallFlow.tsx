"use client";

import { useState, useEffect, useRef } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

type Mode = "bridge" | "jsi" | null;

const bridgeSteps = [
  { label: "JS Call", x: 30, color: "#f9c74f" },
  { label: "JSON.stringify", x: 150, color: "#f94144" },
  { label: "Queue (5ms)", x: 280, color: "#f94144" },
  { label: "JSON.parse", x: 410, color: "#f94144" },
  { label: "Native Exec", x: 540, color: "#43aa8b" },
];

const jsiSteps = [
  { label: "JS Call", x: 80, color: "#f9c74f" },
  { label: "JSI (C++ direct)", x: 260, color: "#577590" },
  { label: "Native Exec", x: 460, color: "#43aa8b" },
];

export default function JSICallFlow() {
  const [mode, setMode] = useState<Mode>(null);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const duration = mode === "bridge" ? 3000 : 800;

  useEffect(() => {
    if (!mode) return;
    setProgress(0);
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode, duration]);

  const steps = mode === "bridge" ? bridgeSteps : mode === "jsi" ? jsiSteps : [];
  const totalW = 680;

  const packetX = steps.length > 0
    ? steps[0].x + 40 + progress * (steps[steps.length - 1].x - steps[0].x)
    : 0;

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Bridge vs JSI 호출 흐름</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setMode("bridge")}
          style={{ padding: "6px 16px", borderRadius: "6px", border: mode === "bridge" ? "1px solid #f94144" : "1px solid #444", background: mode === "bridge" ? "#2a1a1a" : "transparent", color: mode === "bridge" ? "#f94144" : "#999", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
        >Bridge 방식 (느림)</button>
        <button
          onClick={() => setMode("jsi")}
          style={{ padding: "6px 16px", borderRadius: "6px", border: mode === "jsi" ? "1px solid #6cf" : "1px solid #444", background: mode === "jsi" ? "#1a2a3a" : "transparent", color: mode === "jsi" ? "#6cf" : "#999", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
        >JSI 방식 (빠름)</button>
      </div>

      {mode && (
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${totalW} 90`} width="100%" style={{ maxWidth: totalW }}>
            {/* Steps */}
            {steps.map((step, i) => (
              <g key={i}>
                <rect x={step.x} y={20} width={100} height={36} rx={6} fill="#1a1a1a" stroke={step.color} strokeWidth={1} />
                <text x={step.x + 50} y={42} textAnchor="middle" fill={step.color} fontSize={10} fontFamily="inherit">{step.label}</text>
                {i < steps.length - 1 && (
                  <line x1={step.x + 102} y1={38} x2={steps[i + 1].x - 2} y2={38} stroke="#444" strokeWidth={1} strokeDasharray="3,3" />
                )}
              </g>
            ))}

            {/* Animated packet */}
            <circle cx={packetX} cy={72} r={6} fill={mode === "bridge" ? "#f94144" : "#6cf"}>
              <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
            </circle>
            <text x={packetX + 12} y={76} fill="#888" fontSize={9} fontFamily="inherit">
              {progress < 1 ? "전송 중..." : "완료!"}
            </text>

            {/* Time indicator */}
            <text x={totalW - 20} y={76} textAnchor="end" fill="#666" fontSize={10} fontFamily="inherit">
              {Math.round(progress * (mode === "bridge" ? 15 : 0.1) * 10) / 10}ms
            </text>
          </svg>
        </div>
      )}

      {!mode && (
        <div style={{ textAlign: "center", padding: "30px", color: "#555", fontSize: "13px" }}>
          위 버튼을 클릭해 호출 흐름 애니메이션을 시작하세요
        </div>
      )}
    </div>
  );
}
