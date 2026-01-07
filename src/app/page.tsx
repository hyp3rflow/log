import { css } from "../../styled-system/css";

const projects = [
  {
    name: "pbkit",
    href: "https://pbkit.dev/",
    description: "Protobuf toolkit for modern web development",
  },
  {
    name: "wrp",
    href: "https://github.com/pbkit/wrp-ts",
    description: "WebView Request Protocol - message transport between native and WebView",
  },
  {
    name: "urichk",
    href: "https://github.com/riiid/urichk",
    description: "Language for URI validation and code-generator for Next.js",
  },
  {
    name: "vscode-pbkit",
    href: "https://github.com/pbkit/vscode-pbkit",
    description: "VSCode extensions for protocol buffers and urichk files",
  },
];

export default function Home() {
  return (
    <div>
      <section className={css({ mb: "xl" })}>
        <h1 className={css({ fontSize: "14px", fontWeight: 400, mb: "xs" })}>
          Yongwook Choi
        </h1>
        <p className={css({ color: "textMuted" })}>Developer Experience Engineer</p>
      </section>

      <section className={css({ mb: "xl" })}>
        <p className={css({ mb: "sm" })}>
          Builds internal bespoke toolkits and loves contributing open source
          projects in Deno/web ecosystem.
        </p>
        <p className={css({ mb: "sm" })}>
          Previously worked on design system, testprep, Santa (product), and
          productivity utils as Frontend Engineer.
        </p>
        <p>Using Deno, TypeScript, and gRPC with Protocol buffers.</p>
      </section>

      <section className={css({ mb: "xl" })}>
        <h2 className={css({ fontSize: "14px", fontWeight: 400, mb: "md" })}>
          Projects
        </h2>
        <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
          {projects.map((project) => (
            <li key={project.name} className={css({ mb: "sm" })}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.name}
              </a>
              {" "}
              <span className={css({ color: "textMuted" })}>
                - {project.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={css({ fontSize: "14px", fontWeight: 400, mb: "md" })}>
          Contact
        </h2>
        <p className={css({ color: "textMuted", mb: "sm" })}>
          Seoul, S. Korea / UTC+9
        </p>
        <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
          <li>
            <a
              href="https://twitter.com/hrmm_flow"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter
            </a>
            {" "}
            <span className={css({ color: "textMuted" })}>@hrmm_flow</span>
          </li>
          <li>
            <a
              href="https://github.com/hyp3rflow"
              target="_blank"
              rel="noopener noreferrer"
            >
              github
            </a>
            {" "}
            <span className={css({ color: "textMuted" })}>hyp3rflow</span>
          </li>
          <li>
            <a href="mailto:flow@hrmm.xyz">email</a>
            {" "}
            <span className={css({ color: "textMuted" })}>flow@hrmm.xyz</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
