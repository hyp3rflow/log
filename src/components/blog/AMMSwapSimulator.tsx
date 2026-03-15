"use client";

import { useState, useMemo } from "react";

const CONTAINER_STYLE: React.CSSProperties = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 12,
  padding: 24,
  margin: "1.5rem 0",
  fontFamily: "monospace",
  color: "#e0e0e0",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #444",
  borderRadius: 6,
  color: "#fff",
  padding: "6px 10px",
  width: 100,
  fontSize: 14,
  fontFamily: "monospace",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
  marginBottom: 4,
};

const BAR_BG: React.CSSProperties = {
  background: "#222",
  borderRadius: 4,
  height: 24,
  position: "relative",
  overflow: "hidden",
};

export default function AMMSwapSimulator() {
  const [reserveX, setReserveX] = useState(1000);
  const [reserveY, setReserveY] = useState(1000);
  const [swapAmount, setSwapAmount] = useState(100);
  const fee = 0.003;

  const result = useMemo(() => {
    const dx = swapAmount;
    const dxAfterFee = dx * (1 - fee);
    const k = reserveX * reserveY;
    const newReserveX = reserveX + dxAfterFee;
    const newReserveY = k / newReserveX;
    const dy = reserveY - newReserveY;
    const spotPrice = reserveY / reserveX;
    const execPrice = dy / dx;
    const slippage = ((spotPrice - execPrice) / spotPrice) * 100;
    const priceImpact = ((newReserveY / newReserveX - spotPrice) / spotPrice) * 100;
    return { dy, spotPrice, execPrice, slippage, priceImpact, newReserveX, newReserveY, k };
  }, [reserveX, reserveY, swapAmount, fee]);

  const maxReserve = Math.max(result.newReserveX, result.newReserveY, reserveX, reserveY);

  return (
    <div style={CONTAINER_STYLE}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#8b5cf6" }}>
        AMM Swap Simulator (x · y = k)
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={LABEL_STYLE}>Reserve X (Token A)</div>
          <input
            type="number"
            value={reserveX}
            onChange={(e) => setReserveX(Math.max(1, Number(e.target.value)))}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <div style={LABEL_STYLE}>Reserve Y (Token B)</div>
          <input
            type="number"
            value={reserveY}
            onChange={(e) => setReserveY(Math.max(1, Number(e.target.value)))}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <div style={LABEL_STYLE}>Swap Amount (dx)</div>
          <input
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(Math.max(0, Number(e.target.value)))}
            style={INPUT_STYLE}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={LABEL_STYLE}>Output (dy)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e" }}>
            {result.dy.toFixed(4)}
          </div>
        </div>
        <div>
          <div style={LABEL_STYLE}>k (invariant)</div>
          <div style={{ fontSize: 14, color: "#666" }}>{result.k.toLocaleString()}</div>
        </div>
        <div>
          <div style={LABEL_STYLE}>Spot Price (Y/X)</div>
          <div style={{ fontSize: 14 }}>{result.spotPrice.toFixed(6)}</div>
        </div>
        <div>
          <div style={LABEL_STYLE}>Execution Price</div>
          <div style={{ fontSize: 14 }}>{result.execPrice.toFixed(6)}</div>
        </div>
        <div>
          <div style={LABEL_STYLE}>Slippage</div>
          <div style={{ fontSize: 14, color: result.slippage > 5 ? "#ef4444" : result.slippage > 1 ? "#f59e0b" : "#22c55e" }}>
            {result.slippage.toFixed(4)}%
          </div>
        </div>
        <div>
          <div style={LABEL_STYLE}>Price Impact</div>
          <div style={{ fontSize: 14, color: "#f59e0b" }}>
            {result.priceImpact.toFixed(4)}%
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Reserve Changes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>
            Token A: {reserveX.toFixed(0)} → {result.newReserveX.toFixed(2)}
          </div>
          <div style={BAR_BG}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(reserveX / maxReserve) * 100}%`, background: "#334155", borderRadius: 4, transition: "width 0.3s" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(result.newReserveX / maxReserve) * 100}%`, background: "#6366f1", borderRadius: 4, opacity: 0.6, transition: "width 0.3s" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>
            Token B: {reserveY.toFixed(0)} → {result.newReserveY.toFixed(2)}
          </div>
          <div style={BAR_BG}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(reserveY / maxReserve) * 100}%`, background: "#334155", borderRadius: 4, transition: "width 0.3s" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(result.newReserveY / maxReserve) * 100}%`, background: "#22c55e", borderRadius: 4, opacity: 0.6, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#555", marginTop: 12 }}>
        Fee: 0.3% | Formula: dy = y − k / (x + dx·0.997)
      </div>
    </div>
  );
}
