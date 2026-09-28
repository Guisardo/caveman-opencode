import { describe, it, expect } from "vitest";
import { parseSkillMarkdown, loadSkill } from "../skill-loader.js";
import { SKILL_IDS } from "../skill-loader.js";

describe("parseSkillMarkdown", () => {
  it("parses frontmatter and body", () => {
    const input = `---\nname: test\ndescription: A test\n---\n\nBody content`;
    const { meta, body } = parseSkillMarkdown(input);
    expect(meta.name).toBe("test");
    expect(meta.description).toBe("A test");
    expect(body).toBe("Body content");
  });

  it("handles missing frontmatter", () => {
    const input = "No frontmatter here";
    const { meta, body } = parseSkillMarkdown(input);
    expect(meta).toEqual({});
    expect(body).toBe("No frontmatter here");
  });

  it("handles frontmatter with colons in values", () => {
    const input = `---\nname: test\ndescription: A test: with colon\n---\n\nBody`;
    const { meta } = parseSkillMarkdown(input);
    expect(meta.description).toBe("A test: with colon");
  });
});

describe("loadSkill", () => {
  it("returns SkillInfo with correct shape for each skill", async () => {
    for (const skillId of SKILL_IDS) {
      const skill = await loadSkill(skillId);
      expect(skill.id).toBe(skillId);
      expect(typeof skill.name).toBe("string");
      expect(skill.name.length).toBeGreaterThan(0);
      expect(typeof skill.content).toBe("string");
      expect(skill.content.length).toBeGreaterThan(0);
      expect(typeof skill.autoinvoke).toBe("boolean");
    }
  });
});