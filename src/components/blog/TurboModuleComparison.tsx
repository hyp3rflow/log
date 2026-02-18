"use client";

import { useState, useEffect, useRef } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const modules = [
  { name: "Camera", color: "#f9c74f" },
  { name: "Bluetooth", color: "#577590" },
  { name: "Payment", color: "#90be6d" },
  { name: "FileSystem", color: "#f94144" },
  { name: "Geolocation", color: "#43aa8b" },
  { name: "Push", color: "#c9f" },
];

export default function TurboModuleComparison() {
  const [oldTimer, setOldTimer] = useState<number | null>(null);
  const [newLoaded, setNewLoaded] = useState<Set<number>>(new Set());
  const [newTimer, setNewTimer] = useState(0);
  const [oldRunning, setOldRunning] = useState(false);
  const oldRef = useRef<number | null>(null);
  const oldStartRef = useRef(0);

  // Old architecture: load all at startup
  useEffect(() => {
    if (!oldRunning) return;
    oldStartRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - oldStartRef.current;
      setOldTimer(elapsed);
      if (elapsed < 1200) {
        oldRef.current = requestAnimationFrame(tick);
      } else {
        setOldTimer(1200);
        setOldRunning(false);
      }
    };
    oldRef.current = requestAnimationFrame(tick);
    return () => { if (oldRef.current) cancelAnimationFrame(oldRef.current); };
  }, [oldRunning]);

  const handleOldStart = () => {
    setOldTimer(0);
    setOldRunning(true);
  };

  const handleNewLoad = (i: number) => {
    if (newLoaded.has(i)) return;
    setNewLoaded((prev) => new Set(prev).add(i));
    setNewTimer((prev) => prev + 30);
  };

  const handleNewReset = () => {
    setNewLoaded(new Set());
    setNewTimer(0);
  };

  const oldProgress = oldTimer !== null ? Math.min(oldTimer / 1200, 1) : 0;
  const oldModulesLoaded = Math.floor(oldProgress * modules.length);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>NativeModules vs TurboModules — 모듈 로딩 비교</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Old */}
        <div>
          <div style={{ fontSize: "12px", color: "#f94144", marginBottom: "8px", fontWeight: 600 }}>Old: 앱 시작 시 전부 로드</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
            {modules.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#999", width: "80px" }}>{m.name}</span>
                <div style={{ flex: 1, height: "16px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: i < oldModulesLoaded ? "100%" : "0%",
                      height: "100%",
                      background: m.color,
                      borderRadius: "3px",
                      transition: "width 0.2s",
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={handleOldStart} style={{ padding: "4px 12px", borderRadius: "4px", border: "1px solid #444", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
              앱 시작
            </button>
            <span style={{ fontSize: "11px", color: "#f94144" }}>
              {oldTimer !== null ? `${Math.round(oldTimer)}ms` : "—"}
            </span>
          </div>
        </div>

        {/* New */}
        <div>
          <div style={{ fontSize: "12px", color: "#6cf", marginBottom: "8px", fontWeight: 600 }}>New: 사용 시점에 레이지 로드</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
            {modules.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#999", width: "80px" }}>{m.name}</span>
                <div
                  onClick={() => handleNewLoad(i)}
                  style={{ flex: 1, height: "16px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden", cursor: newLoaded.has(i) ? "default" : "pointer", border: newLoaded.has(i) ? "none" : "1px dashed #333" }}
                >
                  <div
                    style={{
                      width: newLoaded.has(i) ? "100%" : "0%",
                      height: "100%",
                      background: m.color,
                      borderRadius: "3px",
                      transition: "width 0.3s",
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={handleNewReset} style={{ padding: "4px 12px", borderRadius: "4px", border: "1px solid #444", background: "transparent", color: "#ccc", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
              리셋
            </button>
            <span style={{ fontSize: "11px", color: "#6cf" }}>
              시작: 0ms / 로드: {newTimer}ms ({newLoaded.size}/{modules.length})
            </span>
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>각 모듈 바를 클릭하면 로드됩니다</div>
        </div>
      </div>
    </div>
  );
}
