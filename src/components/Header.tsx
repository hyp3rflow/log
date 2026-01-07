"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { css } from "../../styled-system/css";

const navItems = [
  { name: "ABOUT", href: "/" },
  { name: "POSTS", href: "/posts" },
  { name: "LINKS", href: "/links" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      className={css({
        borderBottom: "1px solid",
        borderColor: "border",
        bg: "bg",
      })}
    >
      <div
        className={css({
          maxWidth: "640px",
          mx: "auto",
          px: "md",
          py: "md",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <Link
          href="/"
          className={css({
            fontFamily: "mono",
            fontSize: "sm",
            color: "text",
            _hover: { color: "textMuted" },
          })}
        >
          YONGWOOK CHOI
        </Link>
        <nav>
          <ul
            className={css({
              display: "flex",
              gap: "md",
              listStyle: "none",
              m: 0,
              p: 0,
            })}
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={css({
                      fontFamily: "mono",
                      fontSize: "sm",
                      color: "text",
                      _hover: { color: "textMuted" },
                    })}
                  >
                    [{isActive ? <u>{item.name}</u> : item.name}]
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
