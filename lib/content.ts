// Reads /content at build time. Server only. To add a project or a letter, add a .md file.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Content } from "./types";

const root = path.join(process.cwd(), "content");

function read<T>(file: string): T {
  const { data, content } = matter(fs.readFileSync(path.join(root, file), "utf8"));
  return { ...data, slug: path.basename(file, ".md"), body: content.trim() } as T;
}

// Files are ordered by name, so prefix them (01-, 02-, or a date) to control the order.
function readAll<T>(dir: string): T[] {
  return fs
    .readdirSync(path.join(root, dir))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => read<T>(`${dir}/${f}`));
}

export function getContent(): Content {
  return {
    profile: read("profile.md"),
    roles: readAll("roles"),
    projects: readAll("projects"),
    papers: readAll("papers"),
    letters: readAll("letters"),
  };
}
