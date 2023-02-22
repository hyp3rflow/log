/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, Head, PageProps, tw } from "../../client_deps.ts";
import { gfm, Handlers, Marked } from "../../server_deps.ts";
import Footer from "../../components/Footer.tsx";
import NavigationBar from "../../components/Navbar.tsx";
import POSTS, { Post } from "../../data/posts.ts";
import Hero from "../../components/Hero.tsx";

interface Data {
  page: Page;
}

interface Page extends Post {
  markdown: string;
  meta: {
    title: string;
  };
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const slug = ctx.params.slug;
    if (slug === "") {
      return new Response("", {
        status: 307,
        headers: { location: "/links" },
      });
    }
    const url = new URL(`../../links.md`, import.meta.url);
    const markdown = await Deno.readTextFile(url);
    const markup = Marked.parse(markdown);
    const page = { title: "links", path: "links", name: "links", markdown, meta: markup.meta as Page["meta"] };
    const resp = ctx.render({ page });
    return resp;
  },
};

export default function PostPage(props: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>{props.data.page.meta.title ?? "Not Found"} | hrmm</title>
        <link rel="stylesheet" href="/gfm.css" />
      </Head>
      <Hero>Yongwook Choi 👑</Hero>
      <NavigationBar active="/links" />
      <Main path={props.url.pathname} page={props.data.page} />
      <Footer />
    </>
  );
}

function Main(props: { path: string; page: Page }) {
  const main = tw`mx-auto max-w-screen-sm px(4 sm:6 md:8) flex gap-6`;
  return (
    <>
      <div class={main}>
        <Content page={props.page} />
      </div>
    </>
  );
}

function Content(props: { page: Page }) {
  const main = tw`w-full py-8 overflow-hidden`;
  const body = tw`mt-6`;
  const markdown = props.page.markdown.replace(/^---$.*^---$/ms, "");
  const html = gfm.render(markdown);
  return (
    <main class={main}>
      <div
        class={`${body} markdown-body`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
