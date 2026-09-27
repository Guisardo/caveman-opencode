import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseFrontmatter } from "./frontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_ROOT = join(__dirname, "../../commands");

export interface CommandDef {
  name: string;
  skill: string;
  description: string;
}

export const COMMAND_DEFS: readonly CommandDef[] = [
  { name: "caveman", skill: "caveman", description: "Switch caveman intensity level" },
  { name: "caveman-commit", skill: "caveman-commit", description: "Generate terse caveman-style commit message" },
  { name: "caveman-review", skill: "caveman-review", description: "One-line code review comments" },
  { name: "caveman-help", skill: "caveman-help", description: "Show caveman command and mode reference" },
  { name: "caveman-compress", skill: "caveman-compress", description: "Compress a markdown memory file into caveman prose" },
] as const;

export async function loadCommandMeta(name: string): Promise<{ description: string; path: string }> {
  const path = join(COMMANDS_ROOT, `${name}.md`);
  const content = await readFile(path, "utf-8");
  const { meta } = parseFrontmatter(content);
  return { description: meta.description ?? "", path };
}