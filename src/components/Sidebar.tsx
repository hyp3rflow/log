"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { css } from "../../styled-system/css";

const navItems = [
  { name: "about", href: "/" },
  { name: "posts", href: "/posts" },
  { name: "links", href: "/links" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className={css({
        display: "flex",
        flexDirection: "row",
        gap: "xs",
        "@media (min-width: 768px)": {
          flexDirection: "column",
          textAlign: "right",
        },
      })}
    >
      {navItems.map((item, index) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <span key={item.href}>
            <Link
              href={item.href}
              style={{ textDecoration: isActive ? "underline" : "none" }}
            >
              {item.name}
            </Link>
            <span
              className={css({
                "@media (min-width: 768px)": {
                  display: "none",
                },
              })}
            >
              {index < navItems.length - 1 && " / "}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
