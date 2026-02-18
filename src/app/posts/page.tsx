import { css } from "../../../styled-system/css";
import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";

const isAiGenerated = (author?: string) =>
  !!author && /claude|gpt|gemini|llama|opus|sonnet/i.test(author);

export default function PostsPage() {
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.meta.title,
    date: post.meta.date,
    author: post.meta.author,
    isAiGenerated: isAiGenerated(post.meta.author),
  }));

  return (
    <div className={css({ maxWidth: "768px", mx: "auto" })}>
      <h1 className={css({ fontSize: "14px", fontWeight: 400, mb: "xl" })}>
        Posts
      </h1>
      <PostList posts={posts} />
    </div>
  );
}
