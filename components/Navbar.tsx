/** @jsx h */

import { h, tw } from "../client_deps.ts";

const items = [
  {
    name: "About",
    href: "/",
  },
  {
    name: "Posts",
    href: "/posts",
  },
  {
    name: "Links",
    href: "/links",
  }
] as const;
type Href = typeof items[number]["href"];

export default function NavigationBar(props: { active?: Href }) {
  

  return (
    <nav class={tw`max-w-screen-sm mx-auto px(4 sm:6 md:8)`}>
      <ul class={tw`flex justify-end gap-4`}>
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={tw`text-gray-600 hover:underline ${
                props.active === item.href ? "font-bold" : ""
              }`}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
