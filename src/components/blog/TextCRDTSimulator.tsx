"use client";

import { useState, useCallback } from "react";

const WRAPPER: React.CSSProperties = {
  border: "1px solid #333",
  borderRadius: "12px",
  background: "#111",
  padding: "24px",
  margin: "2rem 0",
  fontFamily: "monospace",
};

const NODE_BOX: React.CSSProperties = {
  border: "1px solid #444",
  borderRadius: "8px",
  background: "#1a1a1a",
  padding: "16px",
  flex: 1,
  minWidth: "240px",
};

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "4px",
  border: "1px solid #444",
  background: "#0d0d0d",
  color: "#e0e0e0",
  fontSize: "14px",
  fontFamily: "monospace",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  padding: "5px 12px",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#222",
  color: "#e0e0e0",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "inherit",
};

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN,
  background: "#1a3a5c",
  borderColor: "#2a6ab0",
};

// Simplified RGA-like CRDT for demonstration
// Each character has a unique ID (nodeId, seq) and a reference to the character after which it was inserted.

interface Char {
  id: [string, number]; // [nodeId, seq]
  value: string;
  deleted: boolean;
  afterId: [string, number] | null; // null = beginning
}

function charIdEq(a: [string, number] | null, b: [string, number] | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a[0] === b[0] && a[1] === b[1];
}

function charIdKey(id: [string, number]): string {
  return `${id[0]}:${id[1]}`;
}

// Compare IDs for tie-breaking: higher nodeId wins (placed first)
function compareIds(a: [string, number], b: [string, number]): number {
  if (a[0] > b[0]) return -1;
  if (a[0] < b[0]) return 1;
  return b[1] - a[1];
}

function insertChar(doc: Char[], newChar: Char): Char[] {
  const result = [...doc];
  // Find position: after the char with afterId, then skip concurrent inserts with higher priority
  let idx = 0;
  if (newChar.afterId !== null) {
    idx = result.findIndex((c) => charIdEq(c.id, newChar.afterId));
    if (idx === -1) idx = result.length;
    else idx += 1;
  }
  // Skip chars that were also inserted after the same afterId but have higher priority
  while (idx < result.length) {
    const existing = result[idx]!;
    if (charIdEq(existing.afterId, newChar.afterId)) {
      if (compareIds(existing.id, newChar.id) < 0) {
        idx++;
        continue;
      }
    }
    break;
  }
  result.splice(idx, 0, newChar);
  return result;
}

function docToString(doc: Char[]): string {
  return doc.filter((c) => !c.deleted).map((c) => c.value).join("");
}

interface LogEntry {
  text: string;
  color: string;
}

export default function TextCRDTSimulator() {
  const [docA, setDocA] = useState<Char[]>([]);
  const [docB, setDocB] = useState<Char[]>([]);
  const [seqA, setSeqA] = useState(0);
  const [seqB, setSeqB] = useState(0);
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [posA, setPosA] = useState(0);
  const [posB, setPosB] = useState(0);
  const [pendingOpsA, setPendingOpsA] = useState<Char[]>([]);
  const [pendingOpsB, setPendingOpsB] = useState<Char[]>([]);
  const [log, setLog] = useState<LogEntry[]>([
    { text: "텍스트 CRDT 시뮬레이터 (RGA 기반). 각 노드에서 텍스트를 입력하고 동기화해보세요.", color: "#888" },
  ]);

  const addLog = useCallback((text: string, color: string) => {
    setLog((prev) => [...prev.slice(-15), { text, color }]);
  }, []);

  const getVisibleChars = (doc: Char[]): Char[] => doc.filter((c) => !c.deleted);

  const getAfterIdAtPos = (doc: Char[], pos: number): [string, number] | null => {
    const visible = getVisibleChars(doc);
    if (pos <= 0) return null;
    const target = visible[pos - 1];
    return target ? target.id : null;
  };

  const insertAtNode = (node: "A" | "B") => {
    const text = node === "A" ? inputA : inputB;
    const pos = node === "A" ? posA : posB;
    if (!text) return;
    const doc = node === "A" ? docA : docB;
    const seq = node === "A" ? seqA : seqB;
    const setDoc = node === "A" ? setDocA : setDocB;
    const setSeq = node === "A" ? setSeqA : setSeqB;
    const setInput = node === "A" ? setInputA : setInputB;
    const setPos = node === "A" ? setPosA : setPosB;
    const setPending = node === "A" ? setPendingOpsA : setPendingOpsB;
    const color = node === "A" ? "#4aa8ff" : "#ff7a5c";

    let currentDoc = [...doc];
    let currentSeq = seq;
    const newOps: Char[] = [];

    for (let i = 0; i < text.length; i++) {
      const afterId = i === 0 ? getAfterIdAtPos(currentDoc, pos) : [node, currentSeq - 1] as [string, number];
      const newChar: Char = {
        id: [node, currentSeq],
        value: text[i]!,
        deleted: false,
        afterId,
      };
      currentDoc = insertChar(currentDoc, newChar);
      newOps.push(newChar);
      currentSeq++;
    }

    setDoc(currentDoc);
    setSeq(currentSeq);
    setInput("");
    setPos(pos + text.length);
    setPending((prev) => [...prev, ...newOps]);
    addLog(`Node ${node}: "${text}" 삽입 (위치 ${pos}) → "${docToString(currentDoc)}"`, color);
  };

  const sync = () => {
    let newDocA = [...docA];
    let newDocB = [...docB];

    // Apply B's pending ops to A
    for (const op of pendingOpsB) {
      if (!newDocA.find((c) => charIdEq(c.id, op.id))) {
        newDocA = insertChar(newDocA, op);
      }
    }
    // Apply A's pending ops to B
    for (const op of pendingOpsA) {
      if (!newDocB.find((c) => charIdEq(c.id, op.id))) {
        newDocB = insertChar(newDocB, op);
      }
    }

    setDocA(newDocA);
    setDocB(newDocB);
    setPendingOpsA([]);
    setPendingOpsB([]);

    const strA = docToString(newDocA);
    const strB = docToString(newDocB);
    const converged = strA === strB;
    addLog(
      `동기화 완료: A="${strA}", B="${strB}" ${converged ? "✓ 수렴!" : "✗ 불일치 (버그)"}`,
      converged ? "#5cdb7a" : "#ff4444",
    );
  };

  const reset = () => {
    setDocA([]);
    setDocB([]);
    setSeqA(0);
    setSeqB(0);
    setInputA("");
    setInputB("");
    setPosA(0);
    setPosB(0);
    setPendingOpsA([]);
    setPendingOpsB([]);
    setLog([{ text: "리셋 완료.", color: "#888" }]);
  };

  const strA = docToString(docA);
  const strB = docToString(docB);
  const converged = strA === strB && pendingOpsA.length === 0 && pendingOpsB.length === 0;

  return (
    <div style={WRAPPER}>
      <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "16px" }}>
        <strong style={{ color: "#e0e0e0" }}>텍스트 CRDT 시뮬레이터</strong> — 두
        노드에서 동시에 텍스트를 입력하고 동기화하여 수렴 확인
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        {(["A", "B"] as const).map((node) => {
          const color = node === "A" ? "#4aa8ff" : "#ff7a5c";
          const input = node === "A" ? inputA : inputB;
          const setInput = node === "A" ? setInputA : setInputB;
          const pos = node === "A" ? posA : posB;
          const setPos = node === "A" ? setPosA : setPosB;
          const doc = node === "A" ? docA : docB;
          const pending = node === "A" ? pendingOpsA : pendingOpsB;
          const str = docToString(doc);

          return (
            <div key={node} style={NODE_BOX}>
              <div style={{ color, fontWeight: "bold", marginBottom: "8px", fontSize: "15px" }}>
                Node {node}
                {pending.length > 0 && (
                  <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>
                    ({pending.length} 미전송)
                  </span>
                )}
              </div>
              <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "6px" }}>
                현재 문서: <strong style={{ color: "#e0e0e0" }}>&quot;{str}&quot;</strong>
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "11px", color: "#888", whiteSpace: "nowrap" }}>
                  위치:
                </label>
                <input
                  type="number"
                  min={0}
                  max={getVisibleChars(doc).length}
                  value={pos}
                  onChange={(e) => setPos(Math.max(0, Math.min(getVisibleChars(doc).length, parseInt(e.target.value) || 0)))}
                  style={{ ...INPUT, width: "50px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="텍스트 입력..."
                  style={INPUT}
                  onKeyDown={(e) => e.key === "Enter" && insertAtNode(node)}
                />
                <button style={BTN_PRIMARY} onClick={() => insertAtNode(node)}>
                  삽입
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
        <button style={BTN_PRIMARY} onClick={sync}>
          🔄 동기화 (양방향)
        </button>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "bold",
            background: converged ? "#1a3a1a" : "#3a2a1a",
            color: converged ? "#5cdb7a" : "#ffaa44",
          }}
        >
          {converged ? "✓ 수렴됨" : "⟳ 동기화 필요"}
        </span>
        <button style={{ ...BTN, marginLeft: "auto" }} onClick={reset}>
          리셋
        </button>
      </div>

      <div
        style={{
          background: "#0a0a0a",
          borderRadius: "6px",
          padding: "12px",
          maxHeight: "180px",
          overflowY: "auto",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
      >
        {log.map((entry, i) => (
          <div key={i} style={{ color: entry.color }}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
