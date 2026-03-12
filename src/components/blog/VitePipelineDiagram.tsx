"use client";

export default function VitePipelineDiagram() {
  const boxStyle = (color: string): React.CSSProperties => ({
    padding: "10px 16px",
    borderRadius: 8,
    border: `1px solid ${color}`,
    background: `${color}18`,
    color: "#e0e0e0",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
    minWidth: 140,
  });

  const arrowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: 20,
    padding: "4px 0",
  };

  return (
    <div
      style={{
        background: "#111",
        borderRadius: 12,
        padding: "24px 20px",
        margin: "1.5rem 0",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          minWidth: 500,
        }}
      >
        <div style={boxStyle("#60a5fa")}>
          브라우저 요청
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            GET /src/App.tsx
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#a78bfa")}>
          transformMiddleware
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            server/middlewares/transform.ts
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#f59e0b")}>
          pluginContainer.resolveId()
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            URL → 절대 파일 경로
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#f59e0b")}>
          pluginContainer.load()
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            파일 시스템에서 소스 읽기
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#f59e0b")}>
          pluginContainer.transform()
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            OXC (TSX→JS), CSS, define 치환 등
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#34d399")}>
          importAnalysisPlugin
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            bare import → /@fs/ 또는 /node_modules/.vite/ 경로로 재작성
          </div>
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={boxStyle("#60a5fa")}>
          브라우저에 ESM 응답
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Content-Type: application/javascript
          </div>
        </div>
      </div>
    </div>
  );
}
