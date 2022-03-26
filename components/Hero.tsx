/** @jsx h */

import { ComponentChildren, h, tw } from "../client_deps.ts";

interface HeroProps {
  children: ComponentChildren;
}

export default function Hero({ children }: HeroProps) {
  return (
    <section
      class={tw`max-w-screen-sm mx-auto mt-16 mb-8 px(4 sm:6 md:8) space-y-4`}
    >
      <h1
        class={tw
          `text(3xl sm:4xl lg:5xl gray-900) sm:tracking-tight font-extrabold`}
      >
        {children}
      </h1>
    </section>
  );
}
