# AGENTS.md

> This `AGENTS.md` has been specialized for this repository. Do not rerun the bootstrap routine unless the repo structure, tooling, or architecture changes significantly.

## Start here

Read these before non-trivial changes:

1. `docs/PROJECT_OVERVIEW.md`
2. `docs/architecture.md`
3. `docs/TESTING.md`
4. `docs/security-model.md` when changing browser, broker, credentials, sandbox, or lifecycle behavior
5. `docs/INDEX.md`
6. `plans/active/` for current implementation notes

## Project snapshot

- Runtime: TypeScript on Bun 1.4.0.
- Package manager: Bun.
- Main CLI entrypoint: `src/cli.ts`.
- Responses server: `src/server.ts`.
- ChatGPT Web adapter: `src/adapters/chatgpt-web/`.
- Desktop launcher: `launcher/` (Electron + TypeScript/React build tooling).
- Runtime tests: `tests/*.test.ts`.
- Launcher tests: `launcher/tests/*.test.cjs`.
- Release/runtime scripts: `scripts/`.

## Commands

Run targeted checks first, then the full verification before finishing a meaningful change.

```sh
bun test tests/<target>.test.ts
bun run typecheck
bun run verify
```

`bun run verify` runs version checks, dependency audits, root and launcher typechecks/tests, launcher build, runtime bundle build, third-party notices generation, and release smoke validation.

## Boundaries

- Preserve the native Responses passthrough path unless the task explicitly changes it.
- Keep ChatGPT Web routing/session behavior inside `src/adapters/chatgpt-web/` where practical.
- Treat `src/server.ts` as HTTP/lifecycle orchestration, not the owner of browser-turn semantics.
- Treat `launcher/` as the desktop supervisor and browser host; do not move semantic Codex turn identity into launcher-global state.
- Keep tests beside the existing root/launcher test suites and update architecture/security docs when their invariants change.

## Validation expectations

- Do not invent browser, Codex, or ChatGPT protocol behavior; verify against code/tests.
- Add or update tests for behavior changes.
- Preserve public APIs unless a breaking change is part of the task.
- Do not commit secrets, credentials, cookies, tokens, private browser state, generated release output, or local diagnostic artifacts.
- Prefer small patches and keep unrelated worktree changes intact.

