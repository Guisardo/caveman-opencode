# Caveman OpenCode Plugin — Specification

## Problem Statement

OpenCode users want terse, token-efficient AI responses and a set of slash commands for common workflows (commit messages, code reviews, help references, markdown compression). The upstream Caveman project provides these as standalone prompts, but there was no OpenCode-native distribution that packages them as skills + commands with session-persistent configuration and auto-invocation on session start.

## Solution

A dual-compatibility OpenCode plugin (`opencode-caveman` v1.0.0) that:

- **Exports both v1 and v2 interfaces**: v1 `server()` returns empty object (minimal compat), all logic lives in v2 `setup()`
- **Registers 5 skills** at runtime from `.opencode/skills/*/SKILL.md` via `ctx.skill.transform()`
- **Registers 5 commands** at runtime from `.opencode/commands/*.md` via `ctx.command.transform()`, each invoking its corresponding skill
- **Auto-invokes caveman mode** on every session via `ctx.session.hook("context", ...)` injecting intensity directive into `event.system`
- **Persists user's chosen intensity level** across sessions via `ctx.storage` key `defaultLevel`
- **Validates configuration** via `ctx.options` (config file) with fallbacks to storage then hardcoded defaults

## User Stories

1. As an OpenCode user, I want to install a single plugin that gives me 5 caveman commands and 5 skills, so that I don't have to manually copy files.
2. As an OpenCode user, I want `/caveman` to switch terse response mode on with a default intensity of `full`, so that I get concise answers immediately.
3. As an OpenCode user, I want to change intensity via `/caveman lite|full|ultra|wenyan|wenyan-lite|wenyan-ultra`, so that I can tune verbosity per task.
4. As an OpenCode user, I want my chosen intensity level to persist across sessions, so that I don't have to re-set it every time.
5. As an OpenCode user, I want `/caveman-commit` to generate terse Conventional Commit messages, so that my git history stays clean and scannable.
6. As an OpenCode user, I want `/caveman-review` to produce one-line code review comments, so that PR feedback is actionable not verbose.
7. As an OpenCode user, I want `/caveman-help` to show a quick reference card, so that I can discover all modes and commands.
8. As an OpenCode user, I want `/caveman-compress path/to/file.md` to compress markdown memory files, so that context fits in smaller token budgets.
9. As an OpenCode user, I want caveman mode to auto-activate on every session start without manual invocation, so that I always get terse responses.
10. As an OpenCode user, I want to disable the plugin entirely via config, so that I can opt out without uninstalling.
11. As an OpenCode user on v1, I want the plugin to load without errors, so that backward compatibility is maintained.
12. As a developer, I want TypeScript strict mode and vitest unit tests for pure functions, so that regressions are caught early.

## Implementation Decisions

### Plugin Architecture

- **Dual export**: `Plugin.define({ setup, server })` satisfies both v1 (`server`) and v2 (`setup`) entrypoints
- **v1 `server()`**: Returns `{}` — no v1 hooks needed; all functionality uses v2 APIs
- **Runtime loading**: Skills and commands loaded from markdown files at `setup()` time, not at build time — allows user modifications without rebuild

### Skill Registration

- **5 skills**: `caveman`, `caveman-commit`, `caveman-review`, `caveman-help`, `caveman-compress`
- **Source**: `.opencode/skills/<id>/SKILL.md` — frontmatter parsed for `name`, `description`, `autoinvoke`
- **Auto-invoke**: `caveman` skill has `autoinvoke: true` in frontmatter; also forced in `setup()` for safety
- **Registration**: `ctx.skill.transform(editor => skills.forEach(s => editor.add(s)))`

### Command Registration

- **5 commands**: `caveman`, `caveman-commit`, `caveman-review`, `caveman-help`, `caveman-compress`
- **Source**: `.opencode/commands/<name>.md` — frontmatter parsed for `description`
- **Execution**: Each command invokes `/skill <skillName> <args>` via `ctx.session.prompt()`
- **Registration**: `ctx.command.transform(editor => commands.forEach(c => editor.add({ name: c.name, execute: ... })))`

### Context Hook (Auto-Invoke)

- **Hook point**: `ctx.session.hook("context", (event) => { event.system.push(...) })`
- **Injected text**: `[CAVEMAN MODE: <LEVEL>]\nRespond terse like smart caveman...`
- **Runs on every model call** — ensures caveman instructions always present in system prompt

### Configuration & Storage

| Layer | Source | Priority | Keys |
|-------|--------|----------|------|
| 1 (highest) | `ctx.storage.get("defaultLevel")` | User-overridden, persists across sessions | `defaultLevel` |
| 2 | `ctx.options` (config file) | Project/shared config | `defaultLevel`, `enabled` |
| 3 (lowest) | Hardcoded `DEFAULT_LEVEL = "full"` | Fallback | — |

- **Validation**: `validateOptions()` accepts unknown input, falls back to `{ defaultLevel: "full", enabled: true }`
- **Level validation**: `VALID_LEVELS = ["lite", "full", "ultra", "wenyan", "wenyan-lite", "wenyan-ultra"]` (canonical: `wenyan` not `wenyan-full`)

### Intensity Levels

| Level | Code Value | Skill Doc Name | Command Doc Name |
|-------|------------|----------------|------------------|
| lite | `lite` | lite | lite |
| full | `full` | full | full |
| ultra | `ultra` | ultra | ultra |
| wenyan-lite | `wenyan-lite` | wenyan-lite | wenyan-lite |
| wenyan | `wenyan` | wenyan | wenyan |
| wenyan-ultra | `wenyan-ultra` | wenyan-ultra | wenyan-ultra |

**Resolved**: All locations now use canonical `wenyan` (issue #53, #58).

### TypeScript Configuration

- Extends `@tsconfig/node22`
- `module: nodenext`, `moduleResolution: nodenext`
- `rootDir: .`, `outDir: dist`, `declaration: true`
- Strict mode + `noUncheckedIndexedAccess`
- OpenCode loads TS source directly; `dist/` only for future npm publish

### Testing Strategy (Three-Layer)

1. **TypeScript strict mode** — compile-time correctness
2. **Vitest unit tests** — pure functions only (`options-validator`, `skill-loader` parsing, `command-loader` parsing, `markdown-parser`)
3. **Unit tests for plugin logic** — `index.ts` setup, server, context hook, storage integration (13 tests)
4. **Manual local integration** — `opencode plugin add file://...` for end-to-end verification

### Build & Publish Process

- `tsc --noEmit` for typecheck (CI)
- `tsc --watch` for dev
- `tsc` emits to `dist/` (only for npm publish)
- OpenCode loads `index.ts` directly via `exports: "."` in package.json

## Testing Decisions

### What Makes a Good Test

- Test **external behavior**, not implementation details
- Pure functions get unit tests; integration points get manual verification
- Test edge cases: invalid input, unknown levels, missing frontmatter, empty args

### Modules Tested

| Module | Test File | Coverage |
|--------|-----------|----------|
| `options-validator.ts` | `test/options-validator.test.ts` | All branches: defaults, valid levels, invalid levels, enabled flag, combination |
| `skill-loader.ts` | `test/skill-loader.test.ts` | Frontmatter parsing, missing frontmatter, skill loading |
| `command-loader.ts` | `test/command-loader.test.ts` | Frontmatter parsing, metadata loading |
| `markdown-parser.ts` | `test/markdown-parser.test.ts` | Frontmatter parsing, post-processors |
| `index.ts` | `test/index.test.ts` | Setup, server, context hook, storage, skill/command registration |
| Enum sync | `test/enum-sync.test.ts` | Skill doc, command doc match VALID_LEVELS |

### Prior Art

- Existing tests follow `describe/it/expect` pattern with vitest
- Test invalid input handling explicitly (null, undefined, wrong types)
- Level validation tests cover all 6 valid levels + case sensitivity

## Out of Scope

- Upstream Caveman prompt/content changes — this repo only packages for OpenCode
- OpenCode core changes — plugin uses public `@opencode/plugin` APIs only
- v1 feature parity beyond loading without error — v1 gets minimal compat only
- Wenyan (Classical Chinese) mode usage — 3 wenyan levels maintained for distinct compression tiers (lite/full/ultra pattern)
- Automated CI/CD pipeline — manual `tsc --noEmit` + `vitest run` + local integration test
- npm publish automation — `dist/` exists for future use only

## Further Notes

### Code Review Findings (Post-Implementation) — ALL RESOLVED

| Issue | Location | Status |
|-------|----------|--------|
| Missing `autoinvoke: true` in caveman skill frontmatter | `.opencode/skills/caveman/SKILL.md` | ✅ Fixed |
| No unit tests for `index.ts` plugin logic | `.opencode/plugins/caveman/test/index.test.ts` | ✅ Fixed (13 tests) |
| Level name mismatch: `VALID_LEVELS` has `"wenyan"` vs `"wenyan-full"` | `storage-keys.ts` vs skills/commands | ✅ Fixed (issue #53, #58) |
| Unchecked `prompt.text` in command execution | `index.ts` execute handler | ✅ Fixed (guarded + trimmed) |
| Fragile storage type narrowing | `index.ts` storage handling | ✅ Fixed (Zod schema validation) |
| Unnecessary `async` on `server()` function | `index.ts` | ✅ Fixed (sync) |
| Duplicated frontmatter parser | `frontmatter.ts` shared utility | ✅ Fixed (extracted) |
| Primitive Obsession: config string parsing | `options-validator.ts` | ✅ Addressed (structured validation) |
| Data Clumps: installer config variables | Installers | ⚠️ Installers out of scope |
| Feature Envy: shell heredocs | Installers | ⚠️ Installers out of scope |
| Repeated Switches: 6-level enum in 4 places | `storage-keys.ts` canonical | ✅ Fixed (single source of truth) |
| Message Chains: long path resolution | `skill-loader.ts`, `command-loader.ts` | ⚠️ Acceptable for plugin size |

### Recommended Follow-Up Work — COMPLETE

1. ✅ Add `autoinvoke: true` to caveman skill frontmatter for consistency
2. ✅ Add unit tests for `index.ts` (mock `ctx` for setup, server, hook, storage)
3. ✅ Align level names: canonical `wenyan` used everywhere
4. ✅ Guard `prompt.text` in command execute: trimmed, no trailing space
5. ✅ Strengthen storage narrowing: Zod schema validation in `isStoredLevel`
6. ✅ Remove `async` from `server()`
7. ✅ Extract shared frontmatter parser utility (`frontmatter.ts`)
8. ✅ Maintain 3 Wenyan levels (decision: distinct compression tiers)
9. ✅ Centralize level enum handling (single source of truth in `storage-keys.ts`)