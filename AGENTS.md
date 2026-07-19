# AGENTS.md — Glitchy

Compact guidance for OpenCode sessions in this repo.

## Project type

Single-page Vite + React + TypeScript app. No tests, no linter, no formatter configured. A canvas-based glitch-art image editor.

## Developer commands

- `npm run dev` — start Vite dev server
- `npm run build` — **runs `tsc && vite build`**; the `tsc` step is the only type-checking gate
- `npm run preview` — preview production build

There is **no test, lint, or format script** in `package.json`.

## Formatting

When editing or creating source files, run Prettier afterwards to keep the codebase consistently formatted:

```bash
npx prettier --write <path-to-file>
```

## TypeScript quirks

- `strict: true` — strict type checking enabled
- **`moduleResolution: "bundler"`** → import `.ts`/`.tsx` files **without extensions** (e.g., `import App from './App'`)
- `noEmit: true` — TypeScript is check-only; Vite handles bundling

## Architecture notes

- Entry: `index.html` → `/src/main.tsx` → `App.tsx`
- Effects live in `src/effects/` — one file per effect (`applyFoo.ts`) plus `index.ts` that registers them all in the `effects` array.
- `index.ts` exports `effects: EffectDefinition[]`, `createDefaultEffectStates()`, `EffectState`, and `ConfigValue`.
- Keep canvas/`ImageData` logic in `src/effects/`; keep UI state in `App.tsx`.
- Effects run in the order listed in the `effects` array. `App.tsx` iterates the array on every render.

## Current effects (shipped)

| Effect | File | Controls |
|---|---|---|
| Pixelate | `applyPixelate.ts` | Block size, Grayscale blocks |
| RGB Shift | `applyRGBShift.ts` | Amount, Direction (0-360°), Shift green |
| Jitter | `applyJitter.ts` | Amount, Speed (sine-wave row shift) |
| Scanlines | `applyScanlines.ts` | Darkness, Vertical, Scale |
| Slices | `applySlices.ts` | Count, Offset, Vertical speed |

## Roadmap

Planned effects are tracked as GitHub issues labeled `effect` (repo `fordchastain/Glitchy`), not a checked-in plan file. List them with `gh issue list --label effect`; each issue body holds the full implementation spec.

## Git workflow

Everyday work commits straight to `master`. **Exception:** implementing a tracked effect issue branches (`issue-<n>-<slug>`) and opens a PR that closes the issue, so effects get a review step before landing. This is the only PR-based path — don't generalize it to other changes.

## Gotchas

- `vite.config.ts` adds `.node` to `resolve.extensions`. Do not remove unless you know why.
- No lockfile beyond `package-lock.json`; use `npm`.
