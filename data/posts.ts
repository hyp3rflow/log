export interface Post {
  path: string;
  name: string;
}
const posts: Post[] = [];
for await (const entry of Deno.readDir("./posts")) {
  if (entry.name.endsWith(".md")) {
    posts.push({ path: "./posts/" + entry.name, ...entry });
  }
}

export default posts;
