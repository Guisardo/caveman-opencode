export interface FrontmatterResult {
  meta: Record<string, unknown>;
  body: string;
}

/**
 * Parses frontmatter from markdown content.
 * Handles YAML-like frontmatter with multi-line values (continuation lines starting with space).
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return { meta: {}, body: content };
  }

  const frontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length).trimStart();

  const meta: Record<string, unknown> = {};
  const lines = frontmatter.split("\n");
  let currentKey: string | null = null;
  let currentValue = "";

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0 && line[0] !== " " && line[0] !== "\r") {
      if (currentKey !== null) {
        meta[currentKey] = currentValue.trim();
      }
      currentKey = line.slice(0, colonIndex).trim();
      currentValue = line.slice(colonIndex + 1);
    } else if (currentKey !== null) {
      currentValue += "\n" + line;
    }
  }
  if (currentKey !== null) {
    meta[currentKey] = currentValue.trim();
  }

  return { meta, body };
}

/**
 * Normalizes a string value: converts "true"/"false" to booleans, otherwise returns trimmed string.
 */
export function normalizeValue(value: unknown): string | boolean {
  if (typeof value !== "string") return String(value ?? "");
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

/**
 * Handles YAML folded scalar indicator (>) - extracts content after > and joins lines with spaces.
 */
export function unwrapFoldedScalar(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "");
  if (!value.startsWith(">")) return value;
  const lines = value.split("\n");
  return lines.slice(1).map((l) => l.trimStart()).join(" ").trim();
}