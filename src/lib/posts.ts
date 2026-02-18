import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "posts");

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  author?: string;
  tag?: string;
  status?: string;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
  format: "md" | "mdx";
}

function findPostFile(slug: string): { filePath: string; format: "md" | "mdx" } | null {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) return { filePath: mdxPath, format: "mdx" };
  const mdPath = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(mdPath)) return { filePath: mdPath, format: "md" };
  return null;
}

export function getAllPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((fileName) => {
      const format = fileName.endsWith(".mdx") ? "mdx" as const : "md" as const;
      const slug = fileName.replace(/\.mdx?$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return { slug, meta: data as PostMeta, content, format };
    })
    .filter((post) => post.meta.status !== "wip")
    .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const found = findPostFile(slug);
    if (!found) return null;
    const fileContents = fs.readFileSync(found.filePath, "utf8");
    const { data, content } = matter(fileContents);
    return { slug, meta: data as PostMeta, content, format: found.format };
  } catch {
    return null;
  }
}

export function getLinksContent(): { meta: { title: string }; content: string } | null {
  try {
    const linksPath = path.join(process.cwd(), "links.md");
    const fileContents = fs.readFileSync(linksPath, "utf8");
    const { data, content } = matter(fileContents);
    return { meta: data as { title: string }, content };
  } catch {
    return null;
  }
}
