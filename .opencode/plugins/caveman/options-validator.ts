import { type CavemanLevel, VALID_LEVELS } from "./storage-keys.js";

export type { CavemanLevel };

export interface CavemanPluginOptions {
  /** Default intensity level for auto-invoked caveman mode */
  defaultLevel?: CavemanLevel;
  /** Enable/disable the entire plugin */
  enabled?: boolean;
}

export function validateOptions(opts: unknown): CavemanPluginOptions {
  if (!opts || typeof opts !== "object") return { defaultLevel: "full", enabled: true };
  const o = opts as Record<string, unknown>;
  const defaultLevel: CavemanLevel = VALID_LEVELS.includes(o.defaultLevel as CavemanLevel)
    ? (o.defaultLevel as CavemanLevel)
    : "full";
  const enabled = typeof o.enabled === "boolean" ? o.enabled : true;
  return { defaultLevel, enabled };
}

export function isValidLevel(v: string): v is CavemanLevel {
  return VALID_LEVELS.includes(v as CavemanLevel);
}