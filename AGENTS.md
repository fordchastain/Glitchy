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
- Effects live in `src/effects.ts` and operate directly on `CanvasRenderingContext2D` / `ImageData`.
- Keep canvas logic in `effects.ts`; keep UI state in `App.tsx`.

## Gotchas

- `vite.config.ts` adds `.node` to `resolve.extensions`. Do not remove unless you know why.
- No lockfile beyond `package-lock.json`; use `npm`.
