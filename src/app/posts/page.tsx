import { css } from "../../../styled-system/css";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import AiGenBadge from "@/components/AiGenBadge";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div className={css({ maxWidth: "768px", mx: "auto" })}>
      <h1 className={css({ fontSize: "14px", fontWeight: 400, mb: "xl" })}>
        Posts
      </h1>

      {posts.length === 0 ? (
        <p className={css({ color: "textMuted" })}>No posts yet.</p>
      ) : (
        <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
          {posts.map((post) => (
            <li key={post.slug} className={css({ mb: "sm" })}>
              <span className={css({ color: "textMuted" })}>
                {formatDate(post.meta.date)}
              </span>
              {" "}
              <Link href={`/posts/${post.slug}`}>{post.meta.title}</Link>
              {post.meta.author && /claude|gpt|gemini|llama|opus|sonnet/i.test(post.meta.author) && (
                <AiGenBadge author={post.meta.author} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
