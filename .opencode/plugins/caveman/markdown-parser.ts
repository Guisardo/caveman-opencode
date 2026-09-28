import { parseFrontmatter, normalizeValue, unwrapFoldedScalar } from "./frontmatter.js";

export interface MarkdownMeta {
  [key: string]: unknown;
}

export interface ParseMarkdownOptions<T extends MarkdownMeta> {
  /** Optional function to post-process parsed meta values */
  postProcess?: (meta: Record<string, unknown>) => T;
}

/**
 * Parses markdown content with frontmatter.
 * Returns both the parsed meta (with optional post-processing) and the body content.
 */
export function parseMarkdown<T extends MarkdownMeta = MarkdownMeta>(
  content: string,
  options: ParseMarkdownOptions<T> = {}
): { meta: T; body: string } {
  const { meta, body } = parseFrontmatter(content);
  const processedMeta = options.postProcess ? options.postProcess(meta) : (meta as T);
  return { meta: processedMeta, body };
}

/**
 * Default post-processor for skill markdown files.
 * Normalizes values and unwraps folded scalars for description.
 */
export function skillMetaPostProcessor(meta: Record<string, unknown>): MarkdownMeta {
  const result: MarkdownMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    let normalized = normalizeValue(value);
    if (key === "description") {
      normalized = unwrapFoldedScalar(normalized);
    }
    result[key] = normalized;
  }
  return result;
}

/**
 * Default post-processor for command markdown files.
 * Just passes through the meta as-is.
 */
export function commandMetaPostProcessor(meta: Record<string, unknown>): MarkdownMeta {
  return meta;
}