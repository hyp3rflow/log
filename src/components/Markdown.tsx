"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { File } from "@pierre/diffs/react";
import type { FileContents } from "@pierre/diffs";
import { useMemo } from "react";

interface MarkdownProps {
  content: string;
}

function langFromClassName(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : undefined;
}

function parseFocusMarkers(code: string): {
  cleanCode: string;
  focusLines: Set<number> | null;
} {
  const lines = code.split("\n");
  const focusLines = new Set<number>();

  // Range marker: // [focus:3-5,8]
  const rangeMatch = lines[0]?.match(/^\s*\/\/\s*\[focus:([\d,\s-]+)\]\s*$/);
  if (rangeMatch) {
    for (const part of rangeMatch[1]!.split(",")) {
      const trimmed = part.trim();
      const range = trimmed.match(/^(\d+)-(\d+)$/);
      if (range) {
        for (let i = parseInt(range[1]!); i <= parseInt(range[2]!); i++)
          focusLines.add(i);
      } else {
        const n = parseInt(trimmed);
        if (!isNaN(n)) focusLines.add(n);
      }
    }
    return {
      cleanCode: lines.slice(1).join("\n"),
      focusLines: focusLines.size > 0 ? focusLines : null,
    };
  }

  // Inline marker: // [!focus]
  let hasMarkers = false;
  const cleanLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/\/\/\s*\[!focus\]\s*$/.test(line) || /\/\*\s*\[!focus\]\s*\*\/\s*$/.test(line)) {
      hasMarkers = true;
      focusLines.add(i + 1);
      cleanLines.push(
        line.replace(/\s*\/\/\s*\[!focus\]\s*$/, "").replace(/\s*\/\*\s*\[!focus\]\s*\*\/\s*$/, ""),
      );
    } else {
      cleanLines.push(line);
    }
  }

  if (!hasMarkers) return { cleanCode: code, focusLines: null };
  return {
    cleanCode: cleanLines.join("\n"),
    focusLines: focusLines.size > 0 ? focusLines : null,
  };
}

function buildDimCSS(focusLines: Set<number>, totalLines: number): string {
  const dimmedLines: number[] = [];
  for (let i = 1; i <= totalLines; i++) {
    if (!focusLines.has(i)) dimmedLines.push(i);
  }
  if (dimmedLines.length === 0) return "";
  return dimmedLines
    .map((n) => `[data-line="${n}"] { opacity: 0.35; transition: opacity 0.2s; }`)
    .join("\n");
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const lang = langFromClassName(className);
  const rawCode = String(children).replace(/\n$/, "");

  const { cleanCode, focusLines } = useMemo(
    () => parseFocusMarkers(rawCode),
    [rawCode],
  );
  const totalLines = cleanCode.split("\n").length;
  const unsafeCSS = useMemo(
    () => (focusLines ? buildDimCSS(focusLines, totalLines) : undefined),
    [focusLines, totalLines],
  );

  const file: FileContents = useMemo(
    () => ({
      name: lang ? `code.${lang}` : "code",
      contents: cleanCode,
      ...(lang ? { lang: lang as FileContents["lang"] } : {}),
    }),
    [cleanCode, lang],
  );

  return (
    <File
      file={file}
      options={{
        theme: "pierre-dark",
        ...(unsafeCSS ? { unsafeCSS } : {}),
      }}
      style={{ margin: "1rem 0", borderRadius: "8px", overflow: "hidden" }}
    />
  );
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className && !String(children).includes("\n");
            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
