import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author?: string;
  image?: string;
  tags?: string[];
  content: string;
  contentRaw: string;
};

function ensureBlogDir(): string[] {
  try {
    const files = fs.readdirSync(BLOG_DIR);
    return files.filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

export function getAllPosts(): BlogPost[] {
  const files = ensureBlogDir();
  const posts: BlogPost[] = files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(BLOG_DIR, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: (data.title as string) ?? slug,
        excerpt: (data.excerpt as string) ?? "",
        date: (data.date as string) ?? "",
        author: data.author as string | undefined,
        image: data.image as string | undefined,
        tags: (data.tags as string[]) ?? [],
        content,
        contentRaw: raw,
      };
    })
    .filter((p) => p.date)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: (data.title as string) ?? slug,
      excerpt: (data.excerpt as string) ?? "",
      date: (data.date as string) ?? "",
      author: data.author as string | undefined,
      image: data.image as string | undefined,
      tags: (data.tags as string[]) ?? [],
      content,
      contentRaw: raw,
    };
  } catch {
    return null;
  }
}

export function getAllSlugs(): string[] {
  const files = ensureBlogDir();
  return files.map((f) => f.replace(/\.md$/, ""));
}
