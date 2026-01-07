import { css } from "../../styled-system/css";

export default function Footer() {
  return (
    <footer
      className={css({
        borderTop: "1px solid",
        borderColor: "border",
        py: "md",
        mt: "auto",
      })}
    >
      <div
        className={css({
          maxWidth: "640px",
          mx: "auto",
          px: "md",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "mono",
          fontSize: "sm",
          color: "textMuted",
        })}
      >
        <span>© {new Date().getFullYear()}</span>
        <div className={css({ display: "flex", gap: "sm" })}>
          <a
            href="https://github.com/hyp3rflow"
            target="_blank"
            rel="noopener noreferrer"
            className={css({ color: "text", _hover: { color: "textMuted" } })}
          >
            [GITHUB]
          </a>
          <a
            href="https://twitter.com/hrmm_flow"
            target="_blank"
            rel="noopener noreferrer"
            className={css({ color: "text", _hover: { color: "textMuted" } })}
          >
            [X]
          </a>
        </div>
      </div>
    </footer>
  );
}
