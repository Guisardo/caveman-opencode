## Destination

Create an OpenCode v2 plugin (with v1 compatibility) at `.opencode/plugins/caveman/` that packages the 5 caveman skills and 5 commands, registers them via transforms, and adds a session hook to auto-invoke caveman mode on session start. The plugin must work as a local plugin in `.opencode/plugins/`.

## Notes

- Domain: OpenCode plugin development, TypeScript
- Skills to consult: `/wayfinder` (this map), `/grilling` (for each ticket), `/domain-modeling` (for domain decisions)
- Standing preferences:
  - Local plugin distribution (`.opencode/plugins/caveman/`)
  - Dual v1/v2 compatibility via combined export
  - Skills: caveman, caveman-commit, caveman-review, caveman-help, caveman-compress
  - Commands: caveman, caveman-commit, caveman-review, caveman-help, caveman-compress
  - Auto-invoke caveman mode on session start (configurable default level)
  - Use @opencode/plugin for v2, @opencode-ai/plugin for v1

## Decisions so far

- [#3 — Plugin package.json structure](https://github.com/Guisardo/caveman-opencode/issues/3) — Package named `opencode-caveman` v1.0.0; `@opencode/plugin` as dependency, `@opencode-ai/plugin` as peerDependency; dual export via combined default export with `Plugin.define` + `server()`
- [#4 — TypeScript config](https://github.com/Guisardo/caveman-opencode/issues/4) — Extends `@tsconfig/node22`; `module: nodenext`, `moduleResolution: nodenext`; `rootDir: .`, `outDir: dist`; `declaration: true`; strict mode enabled
- [#5 — v1 plugin entrypoint](https://github.com/Guisardo/caveman-opencode/issues/5) — Minimal `server()` returning `{}`; all functionality (skills, commands, session hook) in v2 `setup()`; v1 entrypoint is compatibility-only
- [#6 — Skill registration](https://github.com/Guisardo/caveman-opencode/issues/6) — Load 5 skills at runtime in `setup()` from `.opencode/skills/` via `ctx.skill.transform()`; parse frontmatter for name/description/autoinvoke; relative path from plugin dir
- [#7 — Command registration](https://github.com/Guisardo/caveman-opencode/issues/7) — Load 5 commands at runtime from `.opencode/commands/` via `ctx.command.transform()`; execute invokes corresponding skill via `/skill <name>` prompt; frontmatter for description
- [#8 — Session hook auto-invoke](https://github.com/Guisardo/caveman-opencode/issues/8) — `ctx.session.hook("context", ...)` injects intensity directive into `event.system`; caveman skill `autoinvoke: true`; default level stored in `ctx.storage`
- [#9 — Configuration schema](https://github.com/Guisardo/caveman-opencode/issues/9) — `ctx.options` for config file (defaultLevel, enabled); `ctx.storage` for user-overridable defaults; validation with fallbacks; config file = initial default, storage = live override
- [#10 — Storage for preferences](https://github.com/Guisardo/caveman-opencode/issues/10) — Covered by #9: `ctx.storage` key `defaultLevel` persists user's chosen intensity level; updated by `caveman` command, read by context hook
- [#11 — Testing strategy](https://github.com/Guisardo/caveman-opencode/issues/11) — Three-layer: TS strict mode (compile-time), vitest unit tests for extracted pure functions (logic), manual local integration via `opencode plugin add` (full plugin)
- [#12 — Build/publish process](https://github.com/Guisardo/caveman-opencode/issues/12) — OpenCode loads TS source directly; `tsc --noEmit` for typecheck; `tsc --watch` for dev; `dist/` only for future npm publish; flat structure at plugin root
- [#18 — Guard prompt.text in command execute](https://github.com/Guisardo/caveman-opencode/issues/18) — Fixed trailing space in `/skill` command by guarding `prompt.text` with conditional; `/skill ${skill}${prompt.text ? \` \${prompt.text}\` : \`\`}` avoids empty arg

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->

- npm publishing (local plugin only per user decision)
- Proxy/middleware integration (separate caveman CLI feature)
- caveman-compress Python script bundling (skills reference scripts via relative paths)
- Codex/Gemini/other agent plugins (separate effort)

## Tickets (Frontier)

- [#17 — Align level names](https://github.com/Guisardo/caveman-opencode/issues/17) — Blocked by #3
- [#19 — Strengthen storage narrowing](https://github.com/Guisardo/caveman-opencode/issues/19) — Ready for agent
- [#20 — Remove unnecessary async from server()](https://github.com/Guisardo/caveman-opencode/issues/20) — Ready for agent
- [#21 — Extract shared frontmatter parser](https://github.com/Guisardo/caveman-opencode/issues/21) — Ready for agent
- [#22 — Centralize level enum handling](https://github.com/Guisardo/caveman-opencode/issues/22) — Blocked by #3, #17