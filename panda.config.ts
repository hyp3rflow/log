import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: "#ffffff" },
          bgAlt: { value: "#f5f5f5" },
          text: { value: "#000000" },
          textMuted: { value: "#666666" },
          accent: { value: "#000000" },
          border: { value: "#e0e0e0" },
          link: { value: "#000000" },
          linkHover: { value: "#666666" },
          selection: { value: "#ffff00" },
        },
        fonts: {
          mono: { value: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace" },
          sans: { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
        },
        fontSizes: {
          xs: { value: "0.75rem" },
          sm: { value: "0.875rem" },
          md: { value: "1rem" },
          lg: { value: "1.125rem" },
          xl: { value: "1.25rem" },
          "2xl": { value: "1.5rem" },
          "3xl": { value: "2rem" },
          "4xl": { value: "2.5rem" },
        },
        spacing: {
          xs: { value: "0.25rem" },
          sm: { value: "0.5rem" },
          md: { value: "1rem" },
          lg: { value: "1.5rem" },
          xl: { value: "2rem" },
          "2xl": { value: "3rem" },
          "3xl": { value: "4rem" },
        },
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },

  globalCss: {
    html: {
      backgroundColor: "bg",
      color: "text",
      fontFamily: "sans",
      fontSize: "16px",
      lineHeight: "1.6",
    },
    body: {
      minHeight: "100vh",
    },
    "::selection": {
      backgroundColor: "selection",
      color: "text",
    },
    a: {
      color: "link",
      textDecoration: "none",
      _hover: {
        color: "linkHover",
      },
    },
    "code, pre": {
      fontFamily: "mono",
    },
  },

  outdir: "styled-system",
  jsxFramework: "react",
});
