import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./frontmatter.js";

const PLUGIN_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const COMMANDS_DIR = resolve(PLUGIN_ROOT, ".opencode/commands");

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

export interface CommandMarkdownMeta {
  description?: string;
  [key: string]: unknown;
}

export function parseCommandMarkdown(markdown: string): { meta: CommandMarkdownMeta; body: string } {
  const { meta, body } = parseFrontmatter(markdown);
  return { meta: meta as CommandMarkdownMeta, body };
}

export async function loadCommandMeta(name: string): Promise<{ description: string; path: string }> {
  const commandPath = resolve(COMMANDS_DIR, `${name}.md`);
  const content = await readFile(commandPath, "utf-8");
  const { meta } = parseCommandMarkdown(content);

  return {
    description: String(meta.description ?? ""),
    path: commandPath,
  };
}