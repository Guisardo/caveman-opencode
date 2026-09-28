import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, normalizeValue, unwrapFoldedScalar } from "./frontmatter.js";

const PLUGIN_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const SKILLS_DIR = resolve(PLUGIN_ROOT, ".opencode/skills");

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
  const { meta, body } = parseFrontmatter(markdown);

  // Handle skill-specific post-processing
  const skillMeta: SkillMarkdownMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    let normalized = normalizeValue(value);
    if (key === "description") {
      normalized = unwrapFoldedScalar(normalized);
    }
    skillMeta[key] = normalized;
  }

  return { meta: skillMeta, body };
}

export async function loadSkill(id: SkillId): Promise<SkillInfo> {
  const skillPath = resolve(SKILLS_DIR, id, "SKILL.md");
  const content = await readFile(skillPath, "utf-8");
  const { meta, body } = parseSkillMarkdown(content);

  return {
    id,
    name: String(meta.name ?? id),
    description: String(meta.description ?? ""),
    path: skillPath,
    content: body,
    autoinvoke: Boolean(meta.autoinvoke),
  };
}