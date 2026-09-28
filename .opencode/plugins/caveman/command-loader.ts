import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const COMMANDS_DIR = resolve(__dirname, "../../commands");

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
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return { meta: {}, body: markdown };
  }

  const frontmatter = frontmatterMatch[1];
  const body = markdown.slice(frontmatterMatch[0].length).trimStart();

  const meta: CommandMarkdownMeta = {};
  const lines = frontmatter.split("\n");
  let currentKey: string | null = null;
  let currentValue = "";

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0 && line[0] !== " ") {
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

export async function loadCommandMeta(name: string): Promise<{ description: string; path: string }> {
  const commandPath = resolve(COMMANDS_DIR, `${name}.md`);
  const content = await readFile(commandPath, "utf-8");
  const { meta } = parseCommandMarkdown(content);

  return {
    description: meta.description ?? "",
    path: commandPath,
  };
}