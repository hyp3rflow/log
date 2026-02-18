"use client";

import { useState } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

interface BoxInfo {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  w: number;
  color: string;
  description: string;
}

const oldBoxes: BoxInfo[] = [
  { id: "js", label: "JS Thread", sublabel: "Hermes / JSC", x: 30, w: 160, color: "#f9c74f", description: "JavaScript 코드가 실행되는 스레드. React 컴포넌트의 render(), state 업데이트, 이벤트 핸들러 등이 여기서 돌아간다." },
  { id: "bridge", label: "Bridge", sublabel: "JSON serialize", x: 240, w: 160, color: "#f94144", description: "JS와 Native 사이의 유일한 통신 채널. 모든 데이터를 JSON으로 직렬화/역직렬화한다. 비동기 only. 배치로 5ms마다 flush한다." },
  { id: "native", label: "Native Thread", sublabel: "UIKit / Android", x: 450, w: 160, color: "#43aa8b", description: "실제 네이티브 뷰를 렌더링하고 사용자 이벤트를 처리하는 메인 스레드. Bridge를 통해 JS의 명령을 받아 실행한다." },
];

const newBoxes: BoxInfo[] = [
  { id: "js", label: "JS Thread", sublabel: "Hermes", x: 10, w: 130, color: "#f9c74f", description: "JavaScript 실행 스레드. Hermes 엔진의 바이트코드 프리컴파일로 빠른 시작. React의 렌더 로직이 여기서 실행된다." },
  { id: "jsi", label: "JSI", sublabel: "C++ direct", x: 170, w: 110, color: "#577590", description: "JavaScript Interface. C++ 추상 레이어로 JS 엔진에 대한 직접 접근을 제공한다. JSON 직렬화 없이 동기/비동기 호출 모두 가능." },
  { id: "cpp", label: "C++ Core", sublabel: "Fabric + Turbo", x: 310, w: 140, color: "#90be6d", description: "플랫폼 공통 C++ 레이어. Fabric 렌더러(Shadow Tree, Yoga 레이아웃)와 TurboModules가 여기서 동작한다. iOS/Android 공유." },
  { id: "native", label: "Native", sublabel: "Platform UI", x: 480, w: 130, color: "#43aa8b", description: "플랫폼별 네이티브 뷰. Fabric의 MountingCoordinator가 diff 결과를 여기에 적용한다. 동기 마운트가 가능해져 UI 응답성이 개선됐다." },
];

function ArchDiagram({ boxes, selected, onSelect }: { boxes: BoxInfo[]; selected: string | null; onSelect: (id: string) => void }) {
  const totalW = 640;
  return (
    <svg viewBox={`0 0 ${totalW} 80`} width="100%" style={{ maxWidth: totalW }}>
      <defs>
        <marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7" fill="none" stroke="#555" strokeWidth="1.5" />
        </marker>
      </defs>
      {boxes.map((box, i) => {
        const isSelected = selected === box.id;
        return (
          <g key={box.id} onClick={() => onSelect(box.id)} style={{ cursor: "pointer" }}>
            <rect
              x={box.x} y={10} width={box.w} height={55} rx={8}
              fill={isSelected ? box.color + "22" : "#1a1a1a"}
              stroke={isSelected ? box.color : "#444"}
              strokeWidth={isSelected ? 2 : 1}
            />
            <text x={box.x + box.w / 2} y={32} textAnchor="middle" fill={isSelected ? box.color : "#ccc"} fontSize={12} fontWeight={600} fontFamily="inherit">{box.label}</text>
            {box.sublabel && (
              <text x={box.x + box.w / 2} y={50} textAnchor="middle" fill="#777" fontSize={9} fontFamily="inherit">{box.sublabel}</text>
            )}
            {i < boxes.length - 1 && (
              <line
                x1={box.x + box.w + 4} y1={37}
                x2={boxes[i + 1].x - 4} y2={37}
                stroke="#555" strokeWidth={1.5} markerEnd="url(#arch-arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function RNArchitectureDiagram() {
  const [tab, setTab] = useState<"old" | "new">("old");
  const [selected, setSelected] = useState<string | null>(null);

  const boxes = tab === "old" ? oldBoxes : newBoxes;
  const selectedBox = boxes.find((b) => b.id === selected);

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Old vs New Architecture</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => { setTab("old"); setSelected(null); }}
          style={{ padding: "6px 16px", borderRadius: "6px", border: tab === "old" ? "1px solid #f94144" : "1px solid #444", background: tab === "old" ? "#2a1a1a" : "transparent", color: tab === "old" ? "#f94144" : "#999", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
        >Old Architecture</button>
        <button
          onClick={() => { setTab("new"); setSelected(null); }}
          style={{ padding: "6px 16px", borderRadius: "6px", border: tab === "new" ? "1px solid #6cf" : "1px solid #444", background: tab === "new" ? "#1a2a3a" : "transparent", color: tab === "new" ? "#6cf" : "#999", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
        >New Architecture</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <ArchDiagram boxes={boxes} selected={selected} onSelect={setSelected} />
      </div>
      {selectedBox && (
        <div style={{ marginTop: "16px", padding: "12px 16px", background: selectedBox.color + "11", borderRadius: "8px", border: `1px solid ${selectedBox.color}33`, fontSize: "13px", color: "#aab", lineHeight: 1.6 }}>
          <strong style={{ color: selectedBox.color }}>{selectedBox.label}</strong>: {selectedBox.description}
        </div>
      )}
    </div>
  );
}
