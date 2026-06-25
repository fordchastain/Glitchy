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
- `App.tsx`: React component with UI state, file upload, button handlers, canvas ref management
- `effects.ts`: Pure functions operating on `CanvasRenderingContext2D` / `ImageData` for pixel manipulation
- `main.tsx`: React app mounting
- `style.css`: Global styles

**Effect system**: Effects in `effects.ts` receive a canvas context and mutate its `ImageData` directly. They do not handle UI state or React lifecycle.

**Canvas lifecycle**:
1. User uploads image → `UploadControl` component loads it → `setImage` updates state
2. `useEffect` in `App` redraws canvas when image changes
3. Effect buttons call handlers that get canvas context and invoke effect functions
4. Reset button redraws original image

## Adding New Effects

1. Add pure function to `effects.ts` that accepts `CanvasRenderingContext2D` and any parameters
2. Add button handler in `App.tsx` that gets canvas ref and calls the effect
3. Add button to the sidebar UI with `disabled={!image}` and `className="effect-btn"`
