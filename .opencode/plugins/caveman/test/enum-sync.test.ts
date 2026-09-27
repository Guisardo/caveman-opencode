import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VALID_LEVELS } from "../storage-keys.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../../..");
const SKILL_DOC_PATH = join(REPO_ROOT, ".opencode/skills/caveman/SKILL.md");
const COMMAND_DOC_PATH = join(REPO_ROOT, ".opencode/commands/caveman.md");

function readDoc(path: string): string {
  return readFileSync(path, "utf-8");
}

function extractLevelsFromSkillDoc(doc: string): string[] {
  const intensitySection = doc.split("## Intensity")[1]?.split("##")[0] || "";
  const levels: string[] = [];
  const levelPattern = /^\|\s*\*\*(\w+(?:-\w+)?)\*\*\s*\|/gm;
  let match: RegExpExecArray | null;
  while ((match = levelPattern.exec(intensitySection)) !== null) {
    if (match[1]) levels.push(match[1]);
  }
  return levels;
}

function extractLevelsFromCommandDoc(doc: string): string[] {
  const parts = doc.split("Supported levels:");
  if (parts.length < 2 || !parts[1]) return [];
  const supportedLine = parts[1].split(/\r?\n/)[0] || "";
  return supportedLine
    .split(",")
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function extractLevelsFromSkillDocDescription(doc: string): string[] {
  const firstEnd = doc.indexOf("---\r\n") !== -1 ? doc.indexOf("---\r\n") : doc.indexOf("---\n");
  if (firstEnd === -1) return [];
  const secondEnd = doc.indexOf("---\r\n", firstEnd + 4) !== -1 ? doc.indexOf("---\r\n", firstEnd + 4) : doc.indexOf("---\n", firstEnd + 4);
  if (secondEnd === -1) return [];
  const frontmatter = doc.slice(0, secondEnd + 4);
  const descMatch = frontmatter.match(/description:\s*>\s*([\s\S]*?)(?:\r?\n\s*(?:autoinvoke|---))/);
  if (!descMatch || !descMatch[1]) return [];
  const description = descMatch[1].replace(/\r?\n\s*/g, " ").trim();
  return VALID_LEVELS.filter((level) => description.includes(level));
}

describe("enum synchronization - single source of truth", () => {
  const expectedLevels = [...VALID_LEVELS];

  it("skill doc intensity table contains all VALID_LEVELS", () => {
    const skillDoc = readDoc(SKILL_DOC_PATH);
    const skillLevels = extractLevelsFromSkillDoc(skillDoc);

    for (const level of expectedLevels) {
      expect(skillLevels).toContain(level);
    }
    expect(skillLevels.length).toBe(expectedLevels.length);
  });

  it("command doc supported levels contains all VALID_LEVELS", () => {
    const commandDoc = readDoc(COMMAND_DOC_PATH);
    const commandLevels = extractLevelsFromCommandDoc(commandDoc);

    for (const level of expectedLevels) {
      expect(commandLevels).toContain(level);
    }
    expect(commandLevels.length).toBe(expectedLevels.length);
  });

  it("skill doc description mentions all VALID_LEVELS", () => {
    const skillDoc = readDoc(SKILL_DOC_PATH);
    const descLevels = extractLevelsFromSkillDocDescription(skillDoc);

    for (const level of expectedLevels) {
      expect(descLevels).toContain(level);
    }
    expect(descLevels.length).toBe(expectedLevels.length);
  });

  it("VALID_LEVELS order matches skill doc intensity table order", () => {
    const skillDoc = readDoc(SKILL_DOC_PATH);
    const skillLevels = extractLevelsFromSkillDoc(skillDoc);
    expect(skillLevels).toEqual(expectedLevels);
  });
});