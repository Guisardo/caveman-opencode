import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const SKILLS_DIR = resolve(__dirname, "../../skills");

export const SKILL_IDS = [
  "caveman",
  "caveman-commit",
  "caveman-review",
  "caveman-help",
  "caveman-compress",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillInfo {
  id: SkillId;
  name: string;
  description: string;
  path: string;
  content: string;
  autoinvoke: boolean;
}

export interface SkillMarkdownMeta {
  name?: string;
  description?: string;
  autoinvoke?: boolean;
  [key: string]: unknown;
}

export function parseSkillMarkdown(markdown: string): { meta: SkillMarkdownMeta; body: string } {
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return { meta: {}, body: markdown };
  }

  const frontmatter = frontmatterMatch[1];
  const body = markdown.slice(frontmatterMatch[0].length).trimStart();

  const meta: SkillMarkdownMeta = {};
  const lines = frontmatter.split("\n");
  let currentKey: string | null = null;
  let currentValue = "";

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0 && line[0] !== " " && line[0] !== "\r") {
      if (currentKey !== null) {
        meta[currentKey] = normalizeValue(currentValue.trim());
      }
      currentKey = line.slice(0, colonIndex).trim();
      currentValue = line.slice(colonIndex + 1);
    } else if (currentKey !== null) {
      currentValue += "\n" + line;
    }
  }
  if (currentKey !== null) {
    meta[currentKey] = normalizeValue(currentValue.trim());
  }

  // Handle YAML folded scalar indicator (>) - extract first line after >
  if (meta.description && typeof meta.description === "string" && meta.description.startsWith(">")) {
    const descLines = meta.description.split("\n");
    meta.description = descLines.slice(1).map(l => l.trimStart()).join(" ").trim();
  }

  return { meta, body };
}

function normalizeValue(value: string): string | boolean {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

export async function loadSkill(id: SkillId): Promise<SkillInfo> {
  const skillPath = resolve(SKILLS_DIR, id, "SKILL.md");
  const content = await readFile(skillPath, "utf-8");
  const { meta, body } = parseSkillMarkdown(content);

  return {
    id,
    name: meta.name ?? id,
    description: meta.description ?? "",
    path: skillPath,
    content: body,
    autoinvoke: meta.autoinvoke ?? false,
  };
}