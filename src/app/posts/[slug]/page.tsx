import { css } from "../../../../styled-system/css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import Markdown from "@/components/Markdown";
import { MdxContent } from "@/components/MdxContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.meta.title} | log`,
    description: post.meta.description,
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className={css({ maxWidth: "768px", mx: "auto" })}>
      <header className={css({ mb: "xl" })}>
        <h1 className={css({ fontSize: "14px", fontWeight: 400, mb: "xs" })}>
          {post.meta.title}
        </h1>
        <p className={css({ color: "textMuted" })}>
          {formatDate(post.meta.date)}
          {post.meta.author && ` / ${post.meta.author}`}
        </p>
      </header>

      {post.format === "mdx" ? (
        <MdxContent source={post.content} />
      ) : (
        <Markdown content={post.content} />
      )}

      <footer className={css({ mt: "xl" })}>
        <Link href="/posts">← back to posts</Link>
      </footer>
    </article>
  );
}
