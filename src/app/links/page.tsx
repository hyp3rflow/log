import { css } from "../../../styled-system/css";
import { getLinksContent } from "@/lib/posts";
import Markdown from "@/components/Markdown";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Links | log",
  description: "Useful links and resources",
};

export default function LinksPage() {
  const links = getLinksContent();

  if (!links) {
    notFound();
  }

  return (
    <div className={css({ maxWidth: "768px", mx: "auto" })}>
      <h1 className={css({ fontSize: "14px", fontWeight: 400, mb: "xl" })}>
        Links
      </h1>

      <Markdown content={links.content} />
    </div>
  );
}
