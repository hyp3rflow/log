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

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const lang = langFromClassName(className);
  const code = String(children).replace(/\n$/, "");

  const file: FileContents = useMemo(
    () => ({
      name: lang ? `code.${lang}` : "code",
      contents: code,
      ...(lang ? { lang: lang as FileContents["lang"] } : {}),
    }),
    [code, lang]
  );

  return (
    <File
      file={file}
      options={{ theme: "pierre-dark" }}
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
