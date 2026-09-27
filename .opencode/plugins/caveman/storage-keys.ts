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