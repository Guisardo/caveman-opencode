export interface FrontmatterResult {
  meta: Record<string, string>;
  body: string;
}

export function parseFrontmatter(content: string): FrontmatterResult {
  const parts = content.split(/^---$/m);
  if (parts.length < 3) return { meta: {}, body: content.trim() };
  const frontmatter = parts[1] ?? "";
  const body = parts.slice(2).join("---").trim();
  const meta: Record<string, string> = {};
  frontmatter.split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  });
  return { meta, body };
}