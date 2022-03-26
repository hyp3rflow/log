/** @jsx h */

import { h, tw } from "../client_deps.ts";

const LINKS = [
  {
    title: "Source",
    href: "https://github.com/lucacasonato/fresh",
  },
];

export default function Footer() {
  const footer = tw
    `max-w-screen-sm mx-auto h-32 flex justify-between px(4 sm:6 md:8) text(xs)`;
  const inner = tw`flex justify-center gap-8`;
  const linkStyle = tw`text-gray-800 hover:underline`;
  const copyright = tw`text(gray-800 center)`;
  return (
    <footer class={footer}>
      <div class={copyright}>
        <span>© {new Date().getFullYear()} Yongwook Choi.</span>
      </div>
      <div class={inner}>
        {LINKS.map((link) => (
          <a href={link.href} class={linkStyle}>
            {link.title}
          </a>
        ))}
      </div>
    </footer>
  );
}
