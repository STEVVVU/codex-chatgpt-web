# Testing

The project uses Bun 1.4.0 for the root runtime and its test runner. Launcher tests are invoked through the launcher's package scripts.

Use the narrowest relevant test first:

```sh
bun test tests/chatgpt-web-harness.test.ts
bun test tests/server-lifecycle.test.ts
bun run typecheck
```

Before finishing a meaningful runtime or launcher change, run:

```sh
bun run verify
```

`scripts/verify.ts` performs the repository's full local gate: version validation, root and launcher dependency audits, TypeScript checks, root and launcher tests, launcher build, runtime bundle build, third-party notice generation, and release smoke validation.

CI workflows live under `.github/workflows/`. Account-bound ChatGPT sign-in, connector, live browser, and release-platform flows require the manual gates documented in [`release-validation.md`](release-validation.md).

