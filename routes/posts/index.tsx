/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, Head, tw } from "../../client_deps.ts";
import Navbar from "../../components/Navbar.tsx";
import Footer from "../../components/Footer.tsx";
import Hero from "../../components/Hero.tsx";
import POSTS from "../../data/posts.ts";
import { Marked } from "../../server_deps.ts";

interface MarkdownMeta {
  title: string;
  date: string;
  description: string;
  tag: string;
  author: string;
}

const timeFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});

const postsWithMarkdown = await Promise.all(POSTS.map(async (post) => {
  const url = new URL(`../../posts/${post.name}`, import.meta.url);
  const markdown = await Deno.readTextFile(url);
  return {post, markdown};
}))

export default function PostsPage() {
  return (
    <>
      <Head>
        <title>log</title>
        <meta
          name="description"
          content="No description provided. :("
        />
      </Head>
      <Hero>Posts</Hero>
      <Navbar active="/posts" />
      <section
        class={tw
          `max-w-screen-sm mx-auto mb-8 px(4 sm:6 md:8) flex flex-col gap-8`}
      >
        {postsWithMarkdown.map(({post, markdown}) => {
          const meta = Marked.parse(markdown).meta as MarkdownMeta;
          return (
            <a href={`/posts/${post.name}`}>
              <div class={tw`flex flex-col gap-4`}>
                <h3 class={tw`text(xl gray-800) font-bold`}>{meta.title}</h3>
                <p class={tw`text(gray-800)`}>
                  {meta.description}{" "}
                  <span class={tw`text(underline gray-500)`}>Read More →</span>
                </p>
                <p class={tw`text(xs gray-500)`}>
                  {timeFormat.format(new Date(meta.date)).replaceAll(",", "")}
                </p>
              </div>
            </a>
          );
        })}
      </section>
      <Footer />
    </>
  );
}
