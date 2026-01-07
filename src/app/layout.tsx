import type { Metadata } from "next";
import "./globals.css";
import { css } from "../../styled-system/css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "log",
  description: "somewhat technical blog by Yongwook Choi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body
        className={css({
          color: "text",
          minHeight: "100vh",
          fontSize: "14px",
          lineHeight: 1.7,
          fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        })}
      >
        <aside
          className={css({
            px: "16px",
            py: "16px",
            "@media (min-width: 768px)": {
              position: "fixed",
              top: 0,
              right: 0,
              py: "16px",
              px: "16px",
            },
          })}
        >
          <Sidebar />
        </aside>
        <main
          className={css({
            px: "16px",
            py: "16px",
          })}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
