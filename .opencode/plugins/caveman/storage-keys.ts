/** Storage keys used by the caveman plugin */
export const STORAGE_KEYS = {
  /** User's chosen default caveman intensity level */
  DEFAULT_LEVEL: "defaultLevel",
} as const;

/**
 * Single source of truth for valid caveman intensity levels.
 *
 * This is the canonical enum definition. All other locations (skill docs, command docs,
 * validation logic) MUST derive from this array. Do not duplicate the level list elsewhere.
 *
 * To add/modify levels:
 * 1. Update this array
 * 2. Run tests to verify skill docs and command docs stay in sync
 * 3. Update skill descriptions if new levels need documentation
 */
export const VALID_LEVELS = [
  "lite",
  "full",
  "ultra",
  "wenyan",
  "wenyan-lite",
  "wenyan-ultra",
] as const;

export type CavemanLevel = (typeof VALID_LEVELS)[number];

/** Generates comma-separated level list for documentation */
export function getLevelList(): string {
  return VALID_LEVELS.join(", ");
}

/** Generates markdown table rows for skill doc intensity table */
export function getSkillDocIntensityRows(): string {
  const descriptions: Record<CavemanLevel, string> = {
    lite: "No filler/hedging. Keep articles + full sentences. Professional but tight",
    full: "Drop articles, fragments OK, short synonyms. Classic caveman",
    ultra: "Abbreviate (DB/auth/config/req/res/fn/impl), strip conjunctions, arrows for causality (X → Y), one word when one word enough",
    wenyan: "Classical Chinese (文言文). 80-90% character reduction. Verbs precede objects, subjects omitted, classical particles (之/乃/為/其)",
    "wenyan-lite": "Semi-classical. Drop filler/hedging but keep grammar structure, classical register",
    "wenyan-ultra": "Extreme abbreviation while keeping classical Chinese feel. Maximum compression, ultra terse",
  };

  return VALID_LEVELS.map((level) => `| **${level}** | ${descriptions[level]} |`).join("\n");
}

/** Generates description text for skill frontmatter */
export function getSkillDescription(): string {
  return `Ultra-compressed communication mode. Cuts token usage ~75% by speaking like caveman while keeping full technical accuracy. Supports intensity levels: ${getLevelList()}. Use when user says "caveman mode", "talk like caveman", "use caveman", "less tokens", "be brief", or invokes /caveman. Also auto-triggers when token efficiency is requested.`;
}

/** Generates default level text for skill doc */
export function getSkillDefaultText(): string {
  return `Default: **full**. Switch: \`/caveman ${VALID_LEVELS.join("|")}\`.`;
}

/** Generates supported levels text for command doc */
export function getCommandSupportedLevels(): string {
  return `If no level is specified, use full. Supported levels: ${getLevelList()}`;
}