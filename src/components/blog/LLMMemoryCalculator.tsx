"use client";

import { useState } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
};

const LABEL: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  marginBottom: "4px",
  display: "block",
};

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#1a1a1a",
  color: "#e0e0e0",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const RESULT_BOX: React.CSSProperties = {
  background: "#1a2a1a",
  border: "1px solid #2a4a2a",
  borderRadius: "8px",
  padding: "16px",
};

const RESULT_ITEM: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #1a3a1a",
  fontSize: "14px",
};

const PRESET_BTN: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "4px",
  border: "1px solid #444",
  background: "transparent",
  color: "#999",
  cursor: "pointer",
  fontSize: "11px",
  fontFamily: "inherit",
};

interface Params {
  params_b: number;
  layers: number;
  hidden_dim: number;
  num_heads: number;
  num_kv_heads: number;
  seq_len: number;
  batch_size: number;
  precision: number; // bytes per param (2=FP16, 4=FP32)
}

const PRESETS: Record<string, Params> = {
  "LLaMA 3 8B": {
    params_b: 8,
    layers: 32,
    hidden_dim: 4096,
    num_heads: 32,
    num_kv_heads: 8,
    seq_len: 8192,
    batch_size: 1,
    precision: 2,
  },
  "LLaMA 3 70B": {
    params_b: 70,
    layers: 80,
    hidden_dim: 8192,
    num_heads: 64,
    num_kv_heads: 8,
    seq_len: 8192,
    batch_size: 1,
    precision: 2,
  },
  "GPT-3 175B": {
    params_b: 175,
    layers: 96,
    hidden_dim: 12288,
    num_heads: 96,
    num_kv_heads: 96,
    seq_len: 2048,
    batch_size: 1,
    precision: 2,
  },
  "Mixtral 8x7B": {
    params_b: 46.7,
    layers: 32,
    hidden_dim: 4096,
    num_heads: 32,
    num_kv_heads: 8,
    seq_len: 32768,
    batch_size: 1,
    precision: 2,
  },
};

function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + " TB";
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + " MB";
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + " KB";
  return bytes.toFixed(0) + " B";
}

function formatFlops(flops: number): string {
  if (flops >= 1e18) return (flops / 1e18).toFixed(2) + " EFLOPs";
  if (flops >= 1e15) return (flops / 1e15).toFixed(2) + " PFLOPs";
  if (flops >= 1e12) return (flops / 1e12).toFixed(2) + " TFLOPs";
  if (flops >= 1e9) return (flops / 1e9).toFixed(2) + " GFLOPs";
  return flops.toFixed(0) + " FLOPs";
}

export default function LLMMemoryCalculator() {
  const [p, setP] = useState<Params>(PRESETS["LLaMA 3 8B"]!);

  const update = (key: keyof Params, val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setP((prev) => ({ ...prev, [key]: n }));
  };

  // Model weights memory
  const modelMemory = p.params_b * 1e9 * p.precision;

  // KV Cache: 2 (K+V) × layers × batch × seq × head_dim × num_kv_heads × precision
  const headDim = p.hidden_dim / p.num_heads;
  const kvCachePerToken = 2 * p.layers * p.num_kv_heads * headDim * p.precision;
  const kvCacheTotal = kvCachePerToken * p.seq_len * p.batch_size;

  // KV Cache if MHA (all heads)
  const kvCacheMHA = 2 * p.layers * p.num_heads * headDim * p.precision * p.seq_len * p.batch_size;

  // Approx FLOPs for forward pass: ~2 × params × seq_len (per token generation, simplified)
  const forwardFlops = 2 * p.params_b * 1e9 * p.seq_len;

  // Attention FLOPs: 2 × batch × layers × num_heads × seq^2 × head_dim
  const attnFlops = 2 * p.batch_size * p.layers * p.num_heads * p.seq_len * p.seq_len * headDim;

  const totalVRAM = modelMemory + kvCacheTotal;
  const kvSavingsRatio = p.num_kv_heads < p.num_heads
    ? ((1 - p.num_kv_heads / p.num_heads) * 100).toFixed(1)
    : "0";

  const precisionLabel = p.precision === 2 ? "FP16/BF16" : p.precision === 4 ? "FP32" : p.precision === 1 ? "INT8" : `${p.precision}B`;

  const fields: { label: string; key: keyof Params; step?: string }[] = [
    { label: "파라미터 수 (B)", key: "params_b", step: "0.1" },
    { label: "레이어 수", key: "layers", step: "1" },
    { label: "Hidden Dimension", key: "hidden_dim", step: "128" },
    { label: "Attention Heads", key: "num_heads", step: "1" },
    { label: "KV Heads (GQA)", key: "num_kv_heads", step: "1" },
    { label: "시퀀스 길이", key: "seq_len", step: "256" },
    { label: "배치 크기", key: "batch_size", step: "1" },
    { label: "정밀도 (bytes)", key: "precision", step: "1" },
  ];

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#e0e0e0", marginBottom: "4px" }}>
        🧮 LLM 메모리 & 연산량 계산기
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
        모델 파라미터를 입력하면 VRAM, KV Cache, FLOPs를 추정합니다
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            key={name}
            onClick={() => setP(preset)}
            style={{
              ...PRESET_BTN,
              ...(JSON.stringify(p) === JSON.stringify(preset)
                ? { border: "1px solid #6cf", color: "#6cf", background: "#1a3a4a" }
                : {}),
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={GRID}>
        {fields.map(({ label, key, step }) => (
          <div key={key}>
            <label style={LABEL}>{label}</label>
            <input
              type="number"
              value={p[key]}
              step={step}
              onChange={(e) => update(key, e.target.value)}
              style={INPUT}
            />
          </div>
        ))}
      </div>

      <div style={RESULT_BOX}>
        <div style={{ fontSize: "13px", color: "#6c6", marginBottom: "12px", fontWeight: 600 }}>
          추정 결과 ({precisionLabel})
        </div>
        <div style={RESULT_ITEM}>
          <span style={{ color: "#aaa" }}>모델 가중치</span>
          <span style={{ color: "#e0e0e0", fontFamily: "monospace" }}>{formatBytes(modelMemory)}</span>
        </div>
        <div style={RESULT_ITEM}>
          <span style={{ color: "#aaa" }}>KV Cache (GQA, {p.num_kv_heads} heads)</span>
          <span style={{ color: "#e0e0e0", fontFamily: "monospace" }}>{formatBytes(kvCacheTotal)}</span>
        </div>
        {p.num_kv_heads < p.num_heads && (
          <div style={RESULT_ITEM}>
            <span style={{ color: "#aaa" }}>KV Cache (MHA 대비 절감)</span>
            <span style={{ color: "#6c6", fontFamily: "monospace" }}>
              −{kvSavingsRatio}% (MHA: {formatBytes(kvCacheMHA)})
            </span>
          </div>
        )}
        <div style={RESULT_ITEM}>
          <span style={{ color: "#aaa" }}>총 VRAM (가중치 + KV)</span>
          <span style={{ color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>{formatBytes(totalVRAM)}</span>
        </div>
        <div style={{ ...RESULT_ITEM, borderBottom: "none" }}>
          <span style={{ color: "#aaa" }}>KV Cache / 토큰</span>
          <span style={{ color: "#e0e0e0", fontFamily: "monospace" }}>{formatBytes(kvCachePerToken)}</span>
        </div>
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #2a4a2a" }}>
          <div style={{ fontSize: "13px", color: "#6c6", marginBottom: "8px", fontWeight: 600 }}>
            연산량
          </div>
          <div style={RESULT_ITEM}>
            <span style={{ color: "#aaa" }}>Forward Pass (≈2NP)</span>
            <span style={{ color: "#e0e0e0", fontFamily: "monospace" }}>{formatFlops(forwardFlops)}</span>
          </div>
          <div style={{ ...RESULT_ITEM, borderBottom: "none" }}>
            <span style={{ color: "#aaa" }}>Attention FLOPs (O(n²))</span>
            <span style={{ color: "#e0e0e0", fontFamily: "monospace" }}>{formatFlops(attnFlops)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
