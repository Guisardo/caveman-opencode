import { describe, it, expect } from "vitest";
import { loadCommandMeta, COMMAND_DEFS } from "../command-loader.js";

describe("loadCommandMeta", () => {
  it("parses description from frontmatter for each command", async () => {
    for (const { name, skill } of COMMAND_DEFS) {
      const { description } = await loadCommandMeta(name);
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it("caveman command has expected description", async () => {
    const { description } = await loadCommandMeta("caveman");
    expect(description).toContain("Switch caveman intensity");
  });

  it("caveman-commit command has expected description", async () => {
    const { description } = await loadCommandMeta("caveman-commit");
    expect(description).toContain("commit message");
  });

  it("caveman-review command has expected description", async () => {
    const { description } = await loadCommandMeta("caveman-review");
    expect(description).toContain("code review");
  });

  it("caveman-help command has expected description", async () => {
    const { description } = await loadCommandMeta("caveman-help");
    expect(description).toContain("reference");
  });

  it("caveman-compress command has expected description", async () => {
    const { description } = await loadCommandMeta("caveman-compress");
    expect(description).toContain("Compress");
  });
});