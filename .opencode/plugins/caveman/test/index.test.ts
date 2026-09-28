import { describe, it, expect, vi, beforeEach } from "vitest";
import { Plugin } from "@opencode/plugin";

// Mock the dependencies before importing the module
vi.mock("./skill-loader.js", () => ({
  SKILL_IDS: ["caveman", "caveman-commit", "caveman-review", "caveman-help", "caveman-compress"] as const,
  loadSkill: vi.fn(async (id: string) => ({
    id,
    name: id,
    description: `Description for ${id}`,
    path: `/fake/path/${id}/SKILL.md`,
    content: `Content for ${id}`,
    autoinvoke: false,
  })),
}));

vi.mock("./command-loader.js", () => ({
  COMMAND_DEFS: [
    { name: "caveman", skill: "caveman", description: "Switch caveman intensity level" },
    { name: "caveman-commit", skill: "caveman-commit", description: "Generate terse caveman-style commit message" },
    { name: "caveman-review", skill: "caveman-review", description: "One-line code review comments" },
    { name: "caveman-help", skill: "caveman-help", description: "Show caveman command and mode reference" },
    { name: "caveman-compress", skill: "caveman-compress", description: "Compress a markdown memory file into caveman prose" },
  ] as const,
  loadCommandMeta: vi.fn(async (name: string) => ({
    description: `Meta description for ${name}`,
    path: `/fake/path/${name}.md`,
  })),
}));

vi.mock("./options-validator.js", () => ({
  validateOptions: vi.fn((opts: unknown) => {
    if (!opts || typeof opts !== "object") return { defaultLevel: "full", enabled: true };
    const o = opts as Record<string, unknown>;
    const validLevels = ["lite", "full", "ultra", "wenyan", "wenyan-lite", "wenyan-ultra"] as const;
    const defaultLevel = validLevels.includes(o.defaultLevel as any) ? o.defaultLevel : "full";
    const enabled = typeof o.enabled === "boolean" ? o.enabled : true;
    return { defaultLevel: defaultLevel as any, enabled };
  }),
  isValidLevel: vi.fn((v: string) => ["lite", "full", "ultra", "wenyan", "wenyan-lite", "wenyan-ultra"].includes(v)),
}));

vi.mock("./storage-keys.js", () => ({
  STORAGE_KEYS: { DEFAULT_LEVEL: "defaultLevel" },
  VALID_LEVELS: ["lite", "full", "ultra", "wenyan", "wenyan-lite", "wenyan-ultra"] as const,
}));

// Import after mocks
import pluginModule from "../index.js";

describe("Caveman Plugin - index.ts", () => {
  let mockCtx: any;
  let skillEditor: any;
  let commandEditor: any;
  let skillTransformMock: any;
  let commandTransformMock: any;
  let sessionHookMock: any;
  let sessionPromptMock: any;
  let storageGetMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    skillEditor = { add: vi.fn() };
    commandEditor = { add: vi.fn() };

    skillTransformMock = vi.fn(async (fn: any) => {
      await fn(skillEditor);
      return skillEditor;
    });

    commandTransformMock = vi.fn(async (fn: any) => {
      await fn(commandEditor);
      return commandEditor;
    });

    sessionHookMock = vi.fn();
    sessionPromptMock = vi.fn();
    storageGetMock = vi.fn();

    mockCtx = {
      options: {},
      storage: { get: storageGetMock },
      skill: { transform: skillTransformMock },
      command: { transform: commandTransformMock },
      session: {
        hook: sessionHookMock,
        prompt: sessionPromptMock,
      },
    };
  });

  describe("setup()", () => {
    it("registers all 5 skills via skill.transform", async () => {
      await pluginModule.setup(mockCtx);

      expect(skillTransformMock).toHaveBeenCalledOnce();
      expect(skillEditor.add).toHaveBeenCalledTimes(5);
    });

    it("forces autoinvoke: true for caveman skill", async () => {
      await pluginModule.setup(mockCtx);

      const cavemanSkillCall = skillEditor.add.mock.calls.find((call: any) => call[0].id === "caveman");
      expect(cavemanSkillCall).toBeDefined();
      expect(cavemanSkillCall[0].autoinvoke).toBe(true);
    });

    it("registers all 5 commands via command.transform", async () => {
      await pluginModule.setup(mockCtx);

      expect(commandTransformMock).toHaveBeenCalledOnce();
      expect(commandEditor.add).toHaveBeenCalledTimes(5);
    });

    it("adds context hook via session.hook", async () => {
      await pluginModule.setup(mockCtx);

      expect(sessionHookMock).toHaveBeenCalledOnce();
      expect(sessionHookMock).toHaveBeenCalledWith("context", expect.any(Function));
    });

    it("reads storage for defaultLevel", async () => {
      storageGetMock.mockResolvedValue({ level: "ultra" });

      await pluginModule.setup(mockCtx);

      expect(storageGetMock).toHaveBeenCalledWith("defaultLevel");
    });

    it("uses stored level over config default when both present", async () => {
      mockCtx.options = { defaultLevel: "lite" };
      storageGetMock.mockResolvedValue({ level: "ultra" });

      await pluginModule.setup(mockCtx);

      // The context hook should receive the stored level (ultra), not config (lite)
      const hookFn = sessionHookMock.mock.calls[0][1]!;
      const event = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event);

      expect(event.system[0]!.text).toContain("[CAVEMAN MODE: ULTRA]");
    });

    it("falls back to config defaultLevel when no storage value", async () => {
      mockCtx.options = { defaultLevel: "lite" };
      storageGetMock.mockResolvedValue(undefined);

      await pluginModule.setup(mockCtx);

      const hookFn = sessionHookMock.mock.calls[0][1]!;
      const event = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event);

      expect(event.system[0]!.text).toContain("[CAVEMAN MODE: LITE]");
    });

    it("falls back to hardcoded default (full) when no storage/config", async () => {
      mockCtx.options = {};
      storageGetMock.mockResolvedValue(undefined);

      await pluginModule.setup(mockCtx);

      const hookFn = sessionHookMock.mock.calls[0][1]!;
      const event = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event);

      expect(event.system[0]!.text).toContain("[CAVEMAN MODE: FULL]");
    });

    it("returns early when enabled: false in config", async () => {
      mockCtx.options = { enabled: false };

      await pluginModule.setup(mockCtx);

      // Should not register skills, commands, or hooks when disabled
      expect(skillTransformMock).not.toHaveBeenCalled();
      expect(commandTransformMock).not.toHaveBeenCalled();
      expect(sessionHookMock).not.toHaveBeenCalled();
      expect(storageGetMock).not.toHaveBeenCalled();
    });

    it("validates stored level against VALID_LEVELS, falls back on invalid", async () => {
      mockCtx.options = { defaultLevel: "lite" };
      storageGetMock.mockResolvedValue({ level: "invalid-level" });

      await pluginModule.setup(mockCtx);

      const hookFn = sessionHookMock.mock.calls[0][1]!;
      const event = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event);

      // Should fall back to config default (lite)
      expect(event.system[0]!.text).toContain("[CAVEMAN MODE: LITE]");
    });
  });

  describe("server()", () => {
    it("returns empty object for v1 compatibility", async () => {
      const result = await pluginModule.server();
      expect(result).toEqual({});
    });
  });

  describe("context hook injection", () => {
    it("injects correct system message with effective level", async () => {
      storageGetMock.mockResolvedValue({ level: "wenyan-lite" });

      await pluginModule.setup(mockCtx);

      const hookFn = sessionHookMock.mock.calls[0][1]!;
      const event = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event);

      expect(event.system).toHaveLength(1);
      expect(event.system[0]!.type).toBe("text");
      expect(event.system[0]!.text).toContain("[CAVEMAN MODE: WENYAN-LITE]");
      expect(event.system[0]!.text).toContain("Respond terse like smart caveman");
    });

    it("hook runs on every call and injects same message", async () => {
      storageGetMock.mockResolvedValue({ level: "full" });

      await pluginModule.setup(mockCtx);

      const hookFn = sessionHookMock.mock.calls[0][1]!;

      // Call hook multiple times
      const event1 = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event1);

      const event2 = { system: [] as Array<{ type: string; text: string }> };
      await hookFn(event2);

      expect(event1.system[0]!.text).toContain("[CAVEMAN MODE: FULL]");
      expect(event2.system[0]!.text).toContain("[CAVEMAN MODE: FULL]");
    });
  });
});