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

function langFromClassName(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : undefined;
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const lang = langFromClassName(className);
  const code = String(children).replace(/\n$/, "");
  const file: FileContents = {
    name: lang ? `code.${lang}` : "code",
    contents: code,
    ...(lang ? { lang: lang as FileContents["lang"] } : {}),
  };
  return (
    <File
      file={file}
      options={{ theme: "pierre-dark" }}
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
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const isInline = !className && !String(children).includes("\n");
    if (isInline) return <code className={className} {...props}>{children}</code>;
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
