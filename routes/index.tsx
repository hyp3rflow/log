/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, Head, tw } from "../client_deps.ts";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import Hero from "../components/Hero.tsx";

export default function MainPage() {
  return (
    <>
      <Head>
        <title>log</title>
        <meta
          name="description"
          content="No description provided. :("
        />
      </Head>
      <Hero>Yongwook Choi ⛵</Hero>
      <Navbar active="/" />
      <Description />
      <Contact />
      <Misc />
      <Footer />
    </>
  );
}

function Description() {
  return (
    <section
      class={tw`max-w-screen-sm mx-auto my-8 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="description" class={tw`text(xl gray-800) font-bold`}>
        <a href="#description" class={tw`hover:underline`}>
          Developer Experience Engineer
        </a>
      </h2>
      <p class={tw`text-gray-800`}>
        Building internal bespoke toolkits and contributing to open source
        projects used in Riiid. Previously made design system, testprep, Santa,
        and productivity utils as Frontend Engineer.
      </p>
      <p class={tw`text-gray-800`}>
        Using <b>Deno</b>, Typescript, and gRPC with Protocol buffers.<br />
        Currently working on these projects:
      </p>
      <ul class={tw`text-gray-800 list-disc list-inside pl-4`}>
        <li>
          <a
            href="https://github.com/pbkit"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>pbkit</b>
          </a>: protobuf toolkit for Typescript and others.
          <ul class={tw`text-gray-800 list-disc list-inside pl-4`}>
            <li>language server for protocol buffers</li>
            <li>chrome extension like network panel for pbkit client</li>
            <li>maintains documentation page</li>
          </ul>
        </li>
        <li>
          <a
            href="https://github.com/pbkit/wrp-ts"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>wrp</b>
          </a>: WebView Request Protocol.
          <ul class={tw`text-gray-800 list-disc list-inside pl-4`}>
            <li>message transport library between native(mobile app) and WebView</li>
            <li>creates/maintains swift library, wrp-swift</li>
            <li>writes documentation and builds examples in deno</li>
          </ul>
        </li>
        <li>
          <a
            href="https://github.com/riiid/urichk"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>urichk</b>
          </a>: langauge for uri validation, and code-generator for Next.js.
        </li>
        <li>
          <a
            href="https://github.com/pbkit/vscode-pbkit"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>vscode extensions</b>
          </a>: for editing protocol buffers and urichk files.
        </li>
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section
      class={tw`max-w-screen-sm mx-auto my-8 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="contact" class={tw`text(xl gray-800) font-bold`}>
        <a href="#contact" class={tw`hover:underline`}>
          Contact
        </a>
      </h2>
      <p>
        Currently living in Seoul, S. Korea. UTC+9 timezone.
      </p>
      <ul class={tw`text-gray-800 list-disc list-inside pl-4`}>
        <li>
          <a
            href="https://twitter.com/hrmm_flow"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>twitter</b>
          </a>: @hrmm_flow
        </li>
        <li>
          <a
            href="https://github.com/hyp3rflow"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>github</b>
          </a>: hyp3rflow
        </li>
        <li>
          <b>email</b>:{" "}
          <a
            href="mailto:hyperflow@kakao.com"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>personal</b>
          </a>,{" "}
          <a
            href="mailto:yongwook.choi@riiid.co"
            class={tw`text-orange-600 hover:underline`}
          >
            <b>business</b>
          </a>{" "}
          (yongwook.choi@riiid.co)
        </li>
      </ul>
    </section>
  );
}

function Misc() {
  return (
    <section
      class={tw`max-w-screen-sm mx-auto my-8 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="example" class={tw`text(xl gray-800) font-bold`}>
        <a href="#example" class={tw`hover:underline`}>
          Misc
        </a>
      </h2>
      <p class={tw`text-gray-800`}>
        This blog is being server side rendered on the fly with{" "}
        <a
          href="https://deno.com"
          class={tw`text-orange-600 hover:underline`}
        >
          <b>Deno deploy</b>
        </a>.<br />
        Built with{" "}
        <a
          href="https://github.com/lucacasonato/fresh"
          class={tw`text-orange-600 hover:underline`}
        >
          <b>Fresh</b>
        </a>{" "}
        and inspired by{" "}
        <a
          href="https://fresh.deno.dev"
          class={tw`text-orange-600 hover:underline`}
        >
          <b>its documentation page</b>
        </a>{" "}
        :).
      </p>
    </section>
  );
}
