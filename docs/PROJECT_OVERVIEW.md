# Project overview

`codex-chatgpt-web` is a local Responses bridge that routes selected `chatgpt-web/*` Codex model requests through a user-authenticated ChatGPT web session while preserving native OpenAI model passthrough.

The root TypeScript runtime owns request parsing, model routing, SSE translation, Codex integration, ChatGPT Web turn/session coordination, compaction, and the local MCP broker. The Electron launcher owns the persistent authenticated browser partition, task-bound browser tabs, runtime supervision, and desktop packaging.

Important paths:

- `src/server.ts` — loopback Responses HTTP and lifecycle orchestration.
- `src/responses/` — native Responses request parsing/state/compaction helpers.
- `src/adapters/chatgpt-web/` — ChatGPT Web browser adapter, session execution, environment provenance, broker, compaction, and browser-worker integration.
- `src/codex-integration*.ts` — Codex configuration and integration state.
- `launcher/` — Electron desktop app, browser host, supervisor, and packaging.
- `tests/` — Bun tests for the root runtime.
- `launcher/tests/` — launcher contract/unit tests.
- `scripts/` — build, verification, release, install, and smoke scripts.

The browser lifecycle currently supports up to five simultaneous task-bound tabs sharing one authenticated Electron partition. Tabs keep independent page state; same-task sequencing and compaction behavior are coordinated by the ChatGPT Web adapter. See [`architecture.md`](architecture.md) for the detailed contract.

