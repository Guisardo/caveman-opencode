/** Storage keys used by the caveman plugin */
export const STORAGE_KEYS = {
  /** User's chosen default caveman intensity level */
  DEFAULT_LEVEL: "defaultLevel",
} as const;

/** Valid caveman intensity levels */
export const VALID_LEVELS = [
  "lite",
  "full",
  "ultra",
  "wenyan",
  "wenyan-lite",
  "wenyan-ultra",
] as const;

export type CavemanLevel = (typeof VALID_LEVELS)[number];