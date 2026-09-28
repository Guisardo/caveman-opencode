import { Plugin } from "@opencode/plugin";
import { SKILL_IDS, loadSkill, type SkillInfo } from "./skill-loader.js";
import { COMMAND_DEFS, loadCommandMeta } from "./command-loader.js";
import { validateOptions, isValidLevel, type CavemanPluginOptions } from "./options-validator.js";
import { STORAGE_KEYS, VALID_LEVELS, type CavemanLevel } from "./storage-keys.js";

const DEFAULT_LEVEL: CavemanLevel = "full";

function isStoredLevel(obj: unknown): obj is { level: CavemanLevel } {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "level" in obj &&
    typeof (obj as { level: unknown }).level === "string" &&
    VALID_LEVELS.includes((obj as { level: string }).level as CavemanLevel)
  );
}

export default {
  ...Plugin.define({
    id: "caveman",
    async setup(ctx) {
      // 1. Read and validate options from config file
      const configOptions = validateOptions(ctx.options);
      if (!configOptions.enabled) return;

      // 2. Load user-overridden default from storage (persists across sessions)
      const stored = await ctx.storage.get(STORAGE_KEYS.DEFAULT_LEVEL);
      const storedLevel = isStoredLevel(stored) ? stored.level : undefined;
      const effectiveLevel: CavemanLevel = storedLevel && VALID_LEVELS.includes(storedLevel as CavemanLevel)
        ? (storedLevel as CavemanLevel)
        : configOptions.defaultLevel ?? DEFAULT_LEVEL;

      // 3. Load and register all 5 skills
      const skills = await Promise.all(SKILL_IDS.map(loadSkill));

      await ctx.skill.transform((editor) => {
        skills.forEach((skill) => {
          const skillToAdd = skill.id === "caveman"
            ? { ...skill, autoinvoke: true }
            : skill;
          editor.add(skillToAdd as Parameters<typeof editor.add>[0]);
        });
      });

      // 4. Load command metadata and register commands
      const commands = await Promise.all(COMMAND_DEFS.map(async ({ name, skill, description }) => {
        const { description: metaDesc, path } = await loadCommandMeta(name);
        return { name, skill, description: metaDesc || description, path };
      }));

      await ctx.command.transform((editor) => {
        commands.forEach(({ name, skill, description }) => {
          editor.add({
            name,
            description,
            execute: async ({ sessionID, prompt, delivery }) => {
              await ctx.session.prompt({
                sessionID,
                text: `/skill ${skill}${prompt.text?.trim() ? ` ${prompt.text.trim()}` : ''}`,
                delivery,
              });
            },
          });
        });
      });

      // 5. Context hook: inject caveman instructions on every model call
      await ctx.session.hook("context", (event) => {
        event.system.push({
          type: "text",
          text: `\n[CAVEMAN MODE: ${effectiveLevel.toUpperCase()}]\nRespond terse like smart caveman. Drop articles, filler, pleasantries, hedging. Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged. Pattern: [thing] [action] [reason]. [next step].\n`,
        });
      });
    },
  }),
  server() {
    // v1: Minimal compatibility - no hooks needed
    // All functionality uses v2 APIs in setup()
    return {};
  },
};