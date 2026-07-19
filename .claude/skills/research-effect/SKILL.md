---
name: research-effect
description: Survey other glitch-art / photo-mosh tools (Photomosh/Mosh, snorpey's image-glitcher, glitch-canvas, etc.), compare their effect menus against Glitchy's shipped effects and open `effect`-labeled issues, find a genuine gap, and propose ONE new effect as a ready-to-file GitHub issue. Research + planning only — never implements the effect. Use when the user says "research a new effect", "what effects are we missing", "look at photomosh and suggest something", or "/research-effect".
---

# research-effect

Looks outward at the glitch-art landscape, compares it to what Glitchy already
has (shipped effects **and** the planned effects tracked as GitHub issues), and
comes back with **one** concrete new-effect proposal formatted as a ready-to-file
issue — so the output can go straight onto the tracker and later be built from
the issue body.

This skill is **research + planning only**. It never writes `src/effects/*` code
or edits `index.ts`. Its single deliverable is a proposed effect issue (filed via
`gh issue create` only after the user approves).

## Input

Optional. A steer like "focus on color effects" or "something like Photomosh's
shader glitches" narrows the search. With no argument, survey broadly and pick
the highest-value gap yourself.

## Steps

1. **Inventory what Glitchy already has — don't propose a duplicate.** Read the
   real source, not memory:
   - `src/effects/index.ts` — the `effectsById` object is the authoritative list
     of **shipped** effects and their exact config fields.
   - `gh issue list --label effect --state open` — the **planned** effects. Read
     the ones that look adjacent to your idea with `gh issue view <n>`; their
     bodies hold full specs. Anything with an open `effect` issue is **already
     claimed** — do not re-propose it. (Also glance at closed ones / recent
     `git log` so you don't propose something just shipped.)
   - `CLAUDE.md` / `AGENTS.md` effect tables as a cross-check.
   Produce a short internal list: `shipped[]`, `planned[]` (issue #s). Every later
   step treats both as off-limits for the final pick.

2. **Survey the landscape** with `WebSearch` / `WebFetch`. Pull the actual effect
   menus of real tools — cite each one with a URL. Known-good reference points
   (search for current versions; don't assume these URLs are live):
   - **Mosh / Photomosh** (photomosh.com, moshpro.app) — VHS, data-mosh,
     feedback, soft/hard glitch, stretch, 8-bit CGA, kaleidoscope, light streak,
     pixel sort, CRT, tile, ASCII, chromatic aberration, halftone/dot-screen.
   - **snorpey / image-glitcher & jpg-glitch & glitch-canvas** (github.com/snorpey) —
     JPEG byte-corruption, channel work, seed/amount corruption on canvas.
   - **GlitchForge, Ditther, ASCII Magic, ROCKIMG, Turbo Dither** — for halftone,
     posterize, ASCII, dither, CRT, oil-slick, ripple/wave, threshold ideas.
   Extract a flat list of **effect categories** these tools expose. Note which are
   genuinely distinct artifact types vs. re-skins of something Glitchy has.

3. **Build the comparison.** A compact table: each notable category from step 2,
   marked `shipped` / `planned (#n)` / `missing` against Glitchy. The `missing`
   rows are the candidate pool. Show this table — it's the evidence for the pick.

4. **Pick exactly one** `missing` effect that best fits Glitchy's constraints
   (see **Fit rules** below). Prefer: visually distinct from everything shipped
   and planned, self-contained, high payoff for low complexity. If two are close,
   say so in one line and pick the simpler.

5. **Write the proposal as a GitHub issue body** using the template below. Ground
   it in the real code: correct `EffectDefinition` shape, real field types, a
   `src/effects/applyFoo.ts` filename, and an algorithm that only uses the
   canvas/`ImageData` primitives the other effects use. Cite which tool(s)
   inspired it.

6. **Present and ask before filing.** Show the comparison table, the pick with a
   one-paragraph rationale, and the full issue body. Then ask whether to file it:
   `gh issue create --title "Effect: <Name>" --label enhancement,effect --body-file <tmp>`.
   Only run `gh issue create` if the user says yes. **Never** implement the effect
   here — building it is a separate step (branch `issue-<n>-<slug>` + PR, per
   CLAUDE.md's "Adding New Effects" / roadmap section).

## Fit rules (Glitchy's hard constraints — a proposal that breaks these is wrong)

- **Pure canvas function, one file.** Signature `applyFoo(ctx: CanvasRenderingContext2D, ...params): void`, operating via `getImageData` / `putImageData` on `ImageData` (or, when it's a full re-render like a dot-screen, drawing directly with `ctx` primitives — note that explicitly). One new file `src/effects/applyFoo.ts` plus one `effectsById` entry. Mirror the structure of the existing effects.
- **No external libraries.** Runtime deps are only `react` / `react-dom`. No npm packages, no WebGL/shader deps, no fonts/assets. If an idea fundamentally needs a shader or a library (e.g. a true GPU bloom), either express it as a plain-JS `ImageData` approximation or reject it and pick another.
- **Static, single render — no animation.** The app renders once per state change with no time/frame input. Don't propose time-based effects, and avoid "speed"-style params (the existing Jitter `speed` / Slices `verticalSpeed` are a known wart — don't add more). A parameter must produce a deterministic result from the current image alone.
- **Deterministic randomness only.** If the effect needs randomness, it must import `createRng` from `src/effects/random.ts` and use a **fixed seed**, so the pattern is stable across unrelated redraws (this is a deliberate convention — Noise and Datamosh use it; the Corrupt issue calls for it too). Never call `Math.random()` directly. If per-effect variation is desirable, propose a `seed` slider that feeds `createRng`.
- **Config fields are `slider` | `checkbox` | `number` only**, each with `key`, `label`, `defaultValue`, and (for numeric types) `min` / `max` / `step`. Keep it to ~2–4 fields. Every field must map to a real parameter of the `apply` function.
- **Use `Uint8ClampedArray`** for output buffers so channel writes auto-clamp to 0–255 (the whole effect suite relies on this).
- **Performance:** a full-frame `getImageData` pass is fine; keep the algorithm roughly `O(pixels)` (or `O(pixels·k)` for a small kernel) and **note the cost in the edge-cases section** if it's a multi-pass / blur-style effect. Provide a no-op fast path for the "zero" setting.
- **Genuinely new.** It must not be a rename of a shipped or planned effect. "Chromatic aberration" ≈ existing RGB Shift; "block glitch" ≈ Datamosh (#5 Corrupt is line-level, distinct); "posterize" overlaps planned Dither (#3) — call out any adjacency and only proceed if the new effect's artifact is clearly different.

## Proposal template (GitHub issue body)

```markdown
**What it does:** <one or two sentences — the visual artifact, and how it differs
from the nearest shipped/planned effect>

**Inspired by:** <tool name(s) + URL(s) this effect is common in>

**Config fields:**

| Key | Type | Default | Range | Label |
| --- | ---- | ------- | ----- | ----- |
| ... | ...  | ...     | ...   | ...   |

**File to create:** `src/effects/applyFoo.ts`

    export function applyFoo(ctx, ...params): void

**Algorithm:**

1. <numbered, concrete steps — real ImageData / ctx operations>
   - Note explicitly if it needs `createRng` (fixed seed) or a temp `Uint8ClampedArray`.

**`index.ts` entry:**

    {
      id: "foo",
      name: "Foo",
      fields: [ /* real ConfigField objects */ ],
      apply: (ctx, config) => applyFoo(ctx, config.x as number, ...),
    }

**Position in array:** <after which existing effect>

**Edge cases:** <zero-setting no-op; bounds clamping; any perf note>
```

## Rules

- Research only. This skill writes nothing under `src/` and edits no source. Its
  only side effect is `gh issue create` — and only after explicit user approval in
  step 6.
- Cite real sources. Every borrowed effect names the tool it came from with a URL
  from `WebSearch`/`WebFetch` — don't invent tools or features from memory.
- One proposal per run. If several gaps are compelling, mention the runners-up in
  a single sentence but fully spec only the top pick.
- Never re-propose a planned (open `effect` issue) or shipped effect. If the best
  gap turns out to be already tracked, say so and pick the next-best `missing` one.
- Keep the issue buildable: correct signatures, real field types, no external
  deps, deterministic — so implementing it later straight from the issue body
  (branch + PR per CLAUDE.md's roadmap section) needs no rework.
```
