import { execSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), "src/components/blog/math-cache");

interface MathProps {
  /** Typst math expression (without surrounding $) */
  expr: string;
  /** Display mode (block) vs inline */
  display?: boolean;
}

function hashExpr(expr: string, display: boolean): string {
  return createHash("sha256")
    .update(`${display ? "d" : "i"}:${expr}`)
    .digest("hex")
    .slice(0, 12);
}

function renderTypstToSVG(expr: string, display: boolean): string {
  const wrapped = display ? `$ ${expr} $` : `$${expr}$`;
  const src = `#set page(width: auto, height: auto, margin: 0.3em, fill: none)
#set text(fill: rgb("#000"), size: ${display ? "16pt" : "14pt"})
${wrapped}`;

  const svg = execSync(`typst compile - /dev/stdout --format svg`, {
    input: src,
    encoding: "utf-8",
    timeout: 5000,
  });

  return svg
    .replace(/<path[^>]*fill="#ffffff"[^>]*\/>/g, "")
    .replace(/width="[^"]*pt"/, "")
    .replace(/height="[^"]*pt"/, "");
}

function getCachedOrRender(expr: string, display: boolean): string {
  const hash = hashExpr(expr, display);
  const cachePath = join(CACHE_DIR, `${hash}.svg`);

  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }

  // Generate with typst CLI (local only)
  if (!mkdirSync(CACHE_DIR, { recursive: true })) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    const svg = renderTypstToSVG(expr, display);
    writeFileSync(cachePath, svg, "utf-8");
    return svg;
  } catch {
    // Fallback: typst not available (e.g. Vercel) — return expr as text
    console.warn(`[Math] typst CLI not available, rendering "${expr}" as text`);
    return `<span style="color:#ccc;font-style:italic">${expr}</span>`;
  }
}

export default function Math({ expr, display = false }: MathProps) {
  const svg = getCachedOrRender(expr, display);

  if (display) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "1.2rem 0",
          overflowX: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        verticalAlign: "middle",
        margin: "0 0.15em",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
