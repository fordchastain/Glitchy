# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Canvas-based glitch art image editor built with Vite + React + TypeScript. Users upload images, apply pixel-manipulation effects (RGB shift, scanlines), and export results.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check with tsc, then build (tsc && vite build)
npm run preview   # Preview production build
```

No test, lint, or format commands configured.

## Formatting

When making file changes, run Prettier on the affected files to keep the codebase consistently formatted:

```bash
npx prettier --write <path-to-file>
```

## TypeScript Configuration

Standard Vite + React + TypeScript setup:
- `moduleResolution: "bundler"` — modern bundler-aware resolution
- Import TypeScript files without extensions: `import App from './App'`
- `strict: true` — strict type checking enabled
- `noEmit: true` — TypeScript only validates; Vite handles bundling
- `vite.config.ts` includes `.node` in resolve extensions

## Architecture

**Entry flow**: `index.html` → `/src/main.tsx` → `App.tsx`

**File responsibilities**:
- `App.tsx`: React component with UI state, file upload, effect toggle/config, export, canvas ref management
- `src/effects/index.ts`: Registers all `EffectDefinition` objects in the `effects` array; exports shared types
- `src/effects/applyFoo.ts`: One file per effect — pure function operating on `CanvasRenderingContext2D` / `ImageData`
- `main.tsx`: React app mounting
- `style.css`: Global styles

**Effect system**: Each effect is declared as an `EffectDefinition` in `src/effects/index.ts` with `id`, `name`, `fields` (config schema), and `apply(ctx, config)`. The `App` component iterates `effects` in order, calling `apply` for each enabled effect after drawing the base image.

**Canvas lifecycle**:
1. User uploads image → `UploadControl` loads it → `setImage` updates state
2. `useEffect` in `App` reruns when `image` or `effectsState` changes — redraws base image then applies every enabled effect in order
3. Config changes (slider release, number blur/Enter, checkbox toggle) update `effectsState`, triggering a redraw
4. Export button calls `canvas.toBlob()` → downloads PNG

## Current effects

| # | Effect | File | Controls |
|---|---|---|---|
| 1 | Pixelate | `applyPixelate.ts` | Block size (1–64), Grayscale blocks |
| 2 | RGB Shift | `applyRGBShift.ts` | Amount (0–100), Direction (0–360°), Shift green |
| 3 | Jitter | `applyJitter.ts` | Amount (0–100), Speed (0–100) — sine-wave row shift |
| 4 | Scanlines | `applyScanlines.ts` | Darkness (0–1), Vertical, Scale (1–20) |
| 5 | Slices | `applySlices.ts` | Count (1–100), Offset (−100–100), Vertical speed (−50–50) |

## Adding New Effects

1. Create `src/effects/applyFoo.ts` — export a pure function `applyFoo(ctx, ...params): void`
2. Add an `EffectDefinition` entry to the `effects` array in `src/effects/index.ts`
3. Run `npx prettier --write src/effects/applyFoo.ts src/effects/index.ts`
4. Run `npm run build` to type-check before committing

## Roadmap & effect workflow

Planned effects live as GitHub issues labeled `effect`, not in a checked-in plan file. Browse them with `gh issue list --label effect`; each issue body carries the full implementation spec (config fields, algorithm, `index.ts` entry, edge cases).

To build one: implement it on a `issue-<n>-<slug>` branch following the "Adding New Effects" steps above, then open a PR that closes the issue (`gh pr create`). Effects are the one workflow that branches + PRs instead of committing straight to `master`.
