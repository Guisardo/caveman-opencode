import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseFrontmatter } from "./frontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = join(__dirname, "../../skills");

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

export function parseSkillMarkdown(content: string) {
  const { meta, body } = parseFrontmatter(content);
  return { meta, body };
}

export async function loadSkill(skillId: SkillId): Promise<SkillInfo> {
  const skillPath = join(SKILLS_ROOT, skillId, "SKILL.md");
  const content = await readFile(skillPath, "utf-8");
  const { meta, body } = parseSkillMarkdown(content);
  return {
    id: skillId,
    name: String(meta.name ?? skillId),
    description: String(meta.description ?? ""),
    path: skillPath,
    content: body,
    autoinvoke: Boolean(meta.autoinvoke),
  };
}