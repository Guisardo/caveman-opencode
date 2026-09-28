import { describe, it, expect } from "vitest";
import { parseMarkdown, skillMetaPostProcessor, commandMetaPostProcessor } from "../markdown-parser.js";

describe("parseMarkdown", () => {
  it("parses frontmatter and body", () => {
    const input = `---\nname: test\ndescription: A test\n---\n\nBody content`;
    const { meta, body } = parseMarkdown(input);
    expect(meta.name).toBe("test");
    expect(meta.description).toBe("A test");
    expect(body).toBe("Body content");
  });

  it("handles missing frontmatter", () => {
    const input = "No frontmatter here";
    const { meta, body } = parseMarkdown(input);
    expect(meta).toEqual({});
    expect(body).toBe("No frontmatter here");
  });

  it("handles frontmatter with colons in values", () => {
    const input = `---\nname: test\ndescription: A test: with colon\n---\n\nBody`;
    const { meta } = parseMarkdown(input);
    expect(meta.description).toBe("A test: with colon");
  });

  it("applies custom post-processor (receives raw meta)", () => {
    const input = `---\nname: test\ndescription: >\n  folded\n  scalar\n---\n\nBody`;
    const { meta } = parseMarkdown(input, {
      postProcess: (m) => ({ name: String(m.name ?? ""), description: String(m.description ?? "") }),
    });
    // Custom post-processor receives raw meta (including > prefix)
    expect(meta.name).toBe("test");
    expect(meta.description).toBe(">\n  folded\n  scalar");
  });
});

describe("skillMetaPostProcessor", () => {
  it("normalizes boolean values", () => {
    const result = skillMetaPostProcessor({ autoinvoke: "true", other: "false" });
    expect(result.autoinvoke).toBe(true);
    expect(result.other).toBe(false);
  });

  it("unwraps folded scalar for description", () => {
    const result = skillMetaPostProcessor({ description: ">\n  folded\n  scalar\n  value" });
    expect(result.description).toBe("folded scalar value");
  });

  it("preserves other values as strings", () => {
    const result = skillMetaPostProcessor({ name: "test", description: "normal" });
    expect(result.name).toBe("test");
    expect(result.description).toBe("normal");
  });
});

describe("commandMetaPostProcessor", () => {
  it("passes through meta unchanged", () => {
    const input = { description: "test", other: "value" };
    const result = commandMetaPostProcessor(input);
    expect(result).toEqual(input);
  });
});