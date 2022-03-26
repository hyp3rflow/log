import { walk } from "https://deno.land/std@0.132.0/fs/mod.ts";

export interface Post {
  path: string;
  name: string;
}
const posts: Post[] = [];
for await (const entry of walk("./posts", { exts: [".md"] })) {
  posts.push(entry);
}

export default posts;
