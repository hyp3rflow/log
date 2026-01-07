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
}

export function getAllPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        meta: data as PostMeta,
        content,
      };
    })
    .filter((post) => post.meta.status !== "wip")
    .sort((a, b) => {
      const dateA = new Date(a.meta.date);
      const dateB = new Date(b.meta.date);
      return dateB.getTime() - dateA.getTime();
    });

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      meta: data as PostMeta,
      content,
    };
  } catch {
    return null;
  }
}

export function getLinksContent(): { meta: { title: string }; content: string } | null {
  try {
    const linksPath = path.join(process.cwd(), "links.md");
    const fileContents = fs.readFileSync(linksPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      meta: data as { title: string },
      content,
    };
  } catch {
    return null;
  }
}
