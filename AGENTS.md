# AGENTS.md - Mobile Device Simulator CLI

This file is for agentic coding assistants working in this repo.
It documents verified commands and code conventions observed in source files.

## Project Snapshot
- Stack: TypeScript Node.js CLI, ESM modules.
- Package manager: npm (`package-lock.json` present).
- Node version: `>=18`.
- Build output: `dist/` from `src/`.
- Tests: Node test runner via `tsx --test`.

## Policy Files Check
- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If these are added later, treat them as higher-priority instructions.

## Setup
```bash
npm install
npm run setup:hooks
```

## Build, Lint, Typecheck, Test
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # alias for typecheck
npm run clean       # removes dist/
npm run build       # clean + tsc
npm run dev         # tsx src/index.ts
npm run test        # tsx --test "src/**/*.test.ts"
npm run check       # lint + test
npm start           # node dist/index.js
```

## Single-Test Execution (Critical)
`npm test -- <file>` is not truly targeted here because the script includes a
hardcoded glob. Use direct `tsx` commands instead.

```bash
npx tsx --test src/state.test.ts
npx tsx --test --test-name-pattern "clampIndex" src/state.test.ts
```

## Hooks
- Lefthook config: `.lefthook.yml`.
- `pre-push` runs `npm test`.

## Release Validation Commands
```bash
npm ci
npm run check
npm run build
npm pack --dry-run
npm publish --dry-run
```

Optional package smoke test:
```bash
PACKAGE_FILE=$(npm pack --silent)
npm install -g "./$PACKAGE_FILE"
mobile-device-simulator --help || true
npm uninstall -g mobile-device-simulator-cli
rm "$PACKAGE_FILE"
```

## Module Boundaries
- `src/index.ts`: CLI entrypoint only (`startCli()`).
- `src/actions.ts`: input handling + orchestration side effects.
- `src/render.ts`: terminal rendering only.
- `src/state.ts`: central mutable app state + selectors/helpers.
- `src/constants.ts`: static menu items, icons, ANSI paint helper.
- `src/command-runner.ts`: sync external command wrapper.
- `src/devices/*.ts`: iOS/Android parse/list/launch/active logic.
- `src/history.ts`: local history persistence.

## TypeScript Guidelines
- Keep `strict` compatibility (`tsconfig.json` has `strict: true`).
- Prefer `type` aliases (current code uses `type` consistently).
- Add explicit return types for exported functions.
- Use `unknown` for untrusted JSON, then narrow with runtime checks.
- Avoid `any`.
- Use discriminated unions for stateful variants where useful.
- Use `import type` for type-only imports.

## Import and ESM Conventions
- ESM only (`"type": "module"`).
- Local imports in `.ts` files use `.js` suffixes.
- Preferred order:
  1) Node built-ins,
  2) internal runtime imports,
  3) type-only imports.
- Prefer named exports over default exports in project source.

## Naming and Formatting Conventions
- Variables/functions: `camelCase`.
- Types: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for fixed constants.
- Files: `kebab-case` for multiword names.
- Keep helper functions focused and small.
- Keep parsing functions pure when possible.

## Error Handling Conventions
- Wrap command boundaries and JSON parse boundaries with `try/catch`.
- Throw informative `Error` messages on contract/parse violations.
- In user-facing flows, convert failures to stable fallback messages.
- For best-effort paths, return safe defaults (`[]`, fallback strings).
- Use `catch {}` only when intentional ignore is required.

## Testing Conventions
- Tests are colocated: `*.test.ts` next to source.
- Test libs: `node:test` and `node:assert/strict`.
- Prefer deterministic unit tests with injected runners/mocks.
- Favor behavior-oriented test names that explain expected result.
- Cover happy paths plus parser/fallback edge cases.

## CLI UX Conventions
- Keep keyboard-first interaction model intact.
- Keep key hints and status text concise and actionable.
- Preserve TTY guards and cursor hide/show behavior.
- Avoid unnecessary async flow changes in this sync-first CLI.

## Agent Workflow Expectations
Before coding:
1. Read relevant source files and nearby tests.
2. Follow existing naming/import/error patterns.
3. Place logic in the correct layer (`devices`, `state`, `actions`, `render`).

After coding:
1. `npm run typecheck`
2. Targeted tests (`npx tsx --test <file>`)
3. Full tests (`npm test`)
4. Build when relevant (`npm run build`)

## Practical Do / Do Not
Do:
- Add or adjust tests when behavior changes.
- Reuse `runCommand` and injected command runners.
- Keep fallback strings and CLI messaging style consistent.

Do not:
- Drop `.js` suffixes from local imports.
- Add dependencies without clear need.
- Bypass hooks or skip verification after behavior changes.

## Maintenance
- Keep this file aligned with `package.json`, `README.md`, and `tsconfig.json`.
- If Cursor/Copilot instruction files appear, mirror and reference them here.
