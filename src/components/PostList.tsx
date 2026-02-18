"use client";

import { useState } from "react";
import { css } from "../../styled-system/css";
import Link from "next/link";
import AiGenBadge from "./AiGenBadge";

interface PostItem {
  slug: string;
  title: string;
  date: string;
  author?: string;
  isAiGenerated: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export default function PostList({ posts }: { posts: PostItem[] }) {
  const [showAi, setShowAi] = useState(false);

  const filtered = showAi ? posts : posts.filter((p) => !p.isAiGenerated);

  return (
    <>
      <label
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "6px",
          mb: "lg",
          fontSize: "12px",
          color: "textMuted",
          cursor: "pointer",
          userSelect: "none",
        })}
      >
        <input
          type="checkbox"
          checked={showAi}
          onChange={(e) => setShowAi(e.target.checked)}
          className={css({ cursor: "pointer" })}
        />
        Show AI-generated articles
      </label>

      {filtered.length === 0 ? (
        <p className={css({ color: "textMuted" })}>No posts yet.</p>
      ) : (
        <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
          {filtered.map((post) => (
            <li key={post.slug} className={css({ mb: "sm" })}>
              <span className={css({ color: "textMuted" })}>
                {formatDate(post.date)}
              </span>{" "}
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              {post.isAiGenerated && post.author && (
                <AiGenBadge author={post.author} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
