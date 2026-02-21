import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { File } from "@pierre/diffs/react";
import type { FileContents } from "@pierre/diffs";

// Blog interactive components
import PackageManagerFlow from "@/components/blog/PackageManagerFlow";
import NodeModulesTree from "@/components/blog/NodeModulesTree";
import CASExplainer from "@/components/blog/CASExplainer";
import RNArchitectureDiagram from "@/components/blog/RNArchitectureDiagram";
import JSICallFlow from "@/components/blog/JSICallFlow";
import TurboModuleComparison from "@/components/blog/TurboModuleComparison";
import FabricPipeline from "@/components/blog/FabricPipeline";
import LLMMemoryCalculator from "@/components/blog/LLMMemoryCalculator";
import TransformerDecoderDiagram from "@/components/blog/TransformerDecoderDiagram";
import AttentionComparisonDiagram from "@/components/blog/AttentionComparisonDiagram";
import HBMStackDiagram from "@/components/blog/HBMStackDiagram";
import RNNvsTransformerDiagram from "@/components/blog/RNNvsTransformerDiagram";
import Math from "@/components/blog/Math";
import RNNCellDiagram from "@/components/blog/RNNCellDiagram";

function langFromClassName(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : undefined;
}

/**
 * Parse focus markers from code content.
 *
 * Supports two syntaxes:
 * 1. Range markers: // [focus:3-5] or // [focus:1,3,7-9]
 *    (single comment at top of code block)
 * 2. Inline markers: // [!focus] at end of a line
 *    (marks individual lines)
 *
 * Returns { cleanCode, focusLines } where cleanCode has markers stripped.
 */
function parseFocusMarkers(code: string): {
  cleanCode: string;
  focusLines: Set<number> | null;
} {
  const lines = code.split("\n");
  const focusLines = new Set<number>();
  let hasMarkers = false;

  // Check for range marker at first line: // [focus:3-5,8]
  const rangeMatch = lines[0]?.match(
    /^\s*\/\/\s*\[focus:([\d,\s-]+)\]\s*$/,
  );
  if (rangeMatch) {
    hasMarkers = true;
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
    // Remove marker line; adjust line numbers (focus numbers are relative to remaining code)
    const cleanLines = lines.slice(1);
    return {
      cleanCode: cleanLines.join("\n"),
      focusLines: focusLines.size > 0 ? focusLines : null,
    };
  }

  // Check for inline markers: // [!focus]
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
  const selectors = dimmedLines
    .map((n) => `[data-line="${n}"]`)
    .join(",\n");
  return `${selectors} { opacity: 0.35; transition: opacity 0.2s; }`;
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
  const { cleanCode, focusLines } = parseFocusMarkers(rawCode);
  const totalLines = cleanCode.split("\n").length;

  const unsafeCSS = focusLines
    ? buildDimCSS(focusLines, totalLines)
    : undefined;

  const file: FileContents = {
    name: lang ? `code.${lang}` : "code",
    contents: cleanCode,
    ...(lang ? { lang: lang as FileContents["lang"] } : {}),
  };
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

const mdxComponents = {
  PackageManagerFlow,
  NodeModulesTree,
  CASExplainer,
  RNArchitectureDiagram,
  JSICallFlow,
  TurboModuleComparison,
  FabricPipeline,
  LLMMemoryCalculator,
  TransformerDecoderDiagram,
  AttentionComparisonDiagram,
  HBMStackDiagram,
  RNNvsTransformerDiagram,
  Math,
  RNNCellDiagram,
  table({ children, ...props }: React.ComponentProps<"table">) {
    return (
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table {...props}>{children}</table>
      </div>
    );
  },
  code({
    className,
    children,
    ...props
  }: React.ComponentProps<"code">) {
    const isInline = !className && !String(children).includes("\n");
    if (isInline)
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  pre({ children }: React.ComponentProps<"pre">) {
    return <>{children}</>;
  },
};

export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
    components: mdxComponents,
  });
  return <div className="markdown-body">{content}</div>;
}
