import { execSync } from "child_process";

interface MathProps {
  /** Typst math expression (without surrounding $) */
  expr: string;
  /** Display mode (block) vs inline */
  display?: boolean;
}

function renderTypstToSVG(expr: string, display: boolean): string {
  const wrapped = display ? `$ ${expr} $` : `$${expr}$`;
  const src = `#set page(width: auto, height: auto, margin: 0.3em, fill: none)
#set text(fill: rgb("#ccc"), size: ${display ? "14pt" : "12pt"})
${wrapped}`;

  const svg = execSync(`typst compile - /dev/stdout --format svg`, {
    input: src,
    encoding: "utf-8",
    timeout: 5000,
  });

  // Remove the white background rect that typst adds
  return svg
    .replace(/<path[^>]*fill="#ffffff"[^>]*\/>/g, "")
    .replace(/width="[^"]*pt"/, "")
    .replace(/height="[^"]*pt"/, "");
}

export default function Math({ expr, display = false }: MathProps) {
  const svg = renderTypstToSVG(expr, display);

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
