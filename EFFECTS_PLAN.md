# Effects Plan — Next 10

Ordered by build priority. Each chunk is self-contained and can be built independently.

**Status key:** `planned` · `in progress` · `done`

| #   | Effect     | Status  |
| --- | ---------- | ------- |
| 1   | Noise      | done    |
| 2   | Pixel Sort | done    |
| 3   | Hue Rotate | done    |
| 4   | Smear      | done    |
| 5   | Datamosh   | planned |
| 6   | Bloom      | planned |
| 7   | Mirror     | planned |
| 8   | Dither     | planned |
| 9   | Vignette   | planned |
| 10  | Corrupt    | planned |

---

## Chunk 1 — Noise

**Status:** done

**What it does:** Adds random pixel-level static over the image. Grayscale mode adds the same random offset to R, G, B (preserves hue). Color mode randomises each channel independently.

**Config fields:**

| Key      | Type     | Default | Range | Label       |
| -------- | -------- | ------- | ----- | ----------- |
| `amount` | slider   | 30      | 0–100 | Amount      |
| `color`  | checkbox | false   | —     | Color noise |

**File to create:** `src/effects/applyNoise.ts`

```
export function applyNoise(ctx, amount, color): void
```

**Algorithm:**

1. `getImageData` → iterate every pixel (`i += 4`)
2. Generate random offset `r = (Math.random() * 2 - 1) * amount`
3. If grayscale: add same `r` to R, G, B channels
4. If color: generate independent `rR`, `rG`, `rB` offsets
5. Clamp all channels to 0–255 via `Uint8ClampedArray` auto-clamping
6. `putImageData`

**`index.ts` entry:**

```ts
{
  id: "noise",
  name: "Noise",
  fields: [
    { type: "slider", label: "Amount", key: "amount", defaultValue: 30, min: 0, max: 100, step: 1 },
    { type: "checkbox", label: "Color noise", key: "color", defaultValue: false },
  ],
  apply: (ctx, config) => applyNoise(ctx, config.amount as number, config.color as boolean),
}
```

**Position in array:** after Slices.

**Edge cases:** amount=0 → no-op (skip loop). Canvas with alpha channel: leave alpha untouched.

---

## Chunk 2 — Pixel Sort

**Status:** done

**What it does:** Finds spans of pixels that cross a brightness threshold, then sorts those spans by luminance. Produces the iconic "melting" glitch columns/rows seen in datamosh art.

**Config fields:**

| Key         | Type     | Default | Range | Label                |
| ----------- | -------- | ------- | ----- | -------------------- |
| `threshold` | slider   | 128     | 0–255 | Threshold            |
| `vertical`  | checkbox | false   | —     | Vertical             |
| `sortDark`  | checkbox | false   | —     | Sort dark (vs light) |

**File to create:** `src/effects/applyPixelSort.ts`

```
export function applyPixelSort(ctx, threshold, vertical, sortDark): void
```

**Algorithm (horizontal mode):**

1. `getImageData` → work on a copy
2. For each row `y`:
   a. Scan left to right to find spans where `luma(pixel) >= threshold` (or `< threshold` if `sortDark`)
   b. A span starts when condition first becomes true and ends when it becomes false
   c. Extract span pixels into a temp array, sort by `luma` ascending
   d. Write sorted pixels back into the span positions
3. For vertical mode: transpose the scan to iterate columns instead of rows
4. `putImageData`

**Luma formula:** `0.299*R + 0.587*G + 0.114*B`

**`index.ts` entry:**

```ts
{
  id: "pixelSort",
  name: "Pixel Sort",
  fields: [
    { type: "slider", label: "Threshold", key: "threshold", defaultValue: 128, min: 0, max: 255, step: 1 },
    { type: "checkbox", label: "Vertical", key: "vertical", defaultValue: false },
    { type: "checkbox", label: "Sort dark", key: "sortDark", defaultValue: false },
  ],
  apply: (ctx, config) =>
    applyPixelSort(ctx, config.threshold as number, config.vertical as boolean, config.sortDark as boolean),
}
```

**Position in array:** after Noise.

**Edge cases:** threshold=0 with sortDark=false → entire image is one span, fully sorted (valid). threshold=255 → no spans found → no-op. Very tall images: sorting per-row is O(width log width) × height — acceptable up to ~4K.

---

## Chunk 3 — Hue Rotate

**Status:** planned

**What it does:** Rotates each pixel's hue around the color wheel and scales saturation. Enables psychedelic color shifts and duotone-style looks when combined with other effects.

**Config fields:**

| Key          | Type   | Default | Range | Label        |
| ------------ | ------ | ------- | ----- | ------------ |
| `hue`        | slider | 0       | 0–360 | Hue shift    |
| `saturation` | slider | 100     | 0–200 | Saturation % |

**File to create:** `src/effects/applyHueRotate.ts`

```
export function applyHueRotate(ctx, hue, saturation): void
```

**Algorithm:**

1. Implement `rgbToHsl(r, g, b) → [h, s, l]` and `hslToRgb(h, s, l) → [r, g, b]` as local helpers
2. `getImageData` → iterate every pixel
3. Convert pixel RGB → HSL
4. `h = (h + hue / 360) % 1`
5. `s = Math.min(1, s * (saturation / 100))`
6. Convert back HSL → RGB, write into output buffer
7. `putImageData`

**HSL conversion reference:** standard formulas; no external library needed (< 30 lines total).

**`index.ts` entry:**

```ts
{
  id: "hueRotate",
  name: "Hue Rotate",
  fields: [
    { type: "slider", label: "Hue shift", key: "hue", defaultValue: 0, min: 0, max: 360, step: 1 },
    { type: "slider", label: "Saturation %", key: "saturation", defaultValue: 100, min: 0, max: 200, step: 1 },
  ],
  apply: (ctx, config) => applyHueRotate(ctx, config.hue as number, config.saturation as number),
}
```

**Position in array:** after Pixel Sort.

**Edge cases:** hue=0, saturation=100 → no-op (still runs, acceptable). Grayscale source images: s=0 throughout, hue shift has no effect — expected.

---

## Chunk 4 — Smear

**Status:** done

**What it does:** Pixels bleed in one direction — bright pixels "drag" their color across the image, simulating VHS tracking errors and tape damage.

**Config fields:**

| Key         | Type     | Default | Range | Label              |
| ----------- | -------- | ------- | ----- | ------------------ |
| `amount`    | slider   | 40      | 0–200 | Amount             |
| `vertical`  | checkbox | false   | —     | Vertical           |
| `threshold` | slider   | 100     | 0–255 | Trigger brightness |

**File to create:** `src/effects/applySmear.ts`

```
export function applySmear(ctx, amount, vertical, threshold): void
```

**Algorithm (horizontal mode):**

1. `getImageData` → work on a copy
2. For each row `y`:
   a. Track a `bleedR, bleedG, bleedB` and `bleedLen` counter (starts 0)
   b. Iterate `x` left to right
   c. If `luma(pixel) >= threshold`: set bleed color to this pixel's RGB, set `bleedLen = amount`
   d. Else if `bleedLen > 0`: write bleed color to this pixel position, decrement `bleedLen`
3. For vertical mode: same pass but iterate columns, scan top-to-bottom
4. `putImageData`

**`index.ts` entry:**

```ts
{
  id: "smear",
  name: "Smear",
  fields: [
    { type: "slider", label: "Amount", key: "amount", defaultValue: 40, min: 0, max: 200, step: 1 },
    { type: "checkbox", label: "Vertical", key: "vertical", defaultValue: false },
    { type: "slider", label: "Trigger brightness", key: "threshold", defaultValue: 100, min: 0, max: 255, step: 1 },
  ],
  apply: (ctx, config) =>
    applySmear(ctx, config.amount as number, config.vertical as boolean, config.threshold as number),
}
```

**Position in array:** after Hue Rotate.

**Edge cases:** amount=0 → bleed never propagates → no-op. threshold=255 → no pixel triggers → no-op. Dark images: raise default threshold or nothing triggers.

---

## Chunk 5 — Datamosh

**Status:** planned

**What it does:** Divides the image into rectangular blocks and randomly displaces a fraction of them, copying pixel data from a different region. Produces the signature datamosh "block shift" aesthetic.

**Config fields:**

| Key         | Type   | Default | Range | Label            |
| ----------- | ------ | ------- | ----- | ---------------- |
| `blockSize` | slider | 16      | 4–64  | Block size       |
| `amount`    | slider | 40      | 0–100 | Max displacement |
| `density`   | slider | 30      | 0–100 | Density %        |

**File to create:** `src/effects/applyDatamosh.ts`

```
export function applyDatamosh(ctx, blockSize, amount, density): void
```

**Algorithm:**

1. `getImageData` → read original into `srcData`, write into `newData` (start as copy of `srcData`)
2. Compute grid: `cols = ceil(width / blockSize)`, `rows = ceil(height / blockSize)`
3. For each grid cell `(col, row)`:
   a. If `Math.random() > density / 100`: skip (leave as original)
   b. Generate random displacement `dx = (Math.random() * 2 - 1) * amount`, `dy = (Math.random() * 2 - 1) * amount`
   c. `srcCol = clamp(col + round(dx * cols / 100), 0, cols-1)`, same for row
   d. Copy pixels from source block `(srcCol, srcRow)` into destination block `(col, row)` in `newData`
4. `putImageData(new ImageData(newData, width, height), 0, 0)`

**`index.ts` entry:**

```ts
{
  id: "datamosh",
  name: "Datamosh",
  fields: [
    { type: "slider", label: "Block size", key: "blockSize", defaultValue: 16, min: 4, max: 64, step: 1 },
    { type: "slider", label: "Max displacement", key: "amount", defaultValue: 40, min: 0, max: 100, step: 1 },
    { type: "slider", label: "Density %", key: "density", defaultValue: 30, min: 0, max: 100, step: 1 },
  ],
  apply: (ctx, config) =>
    applyDatamosh(ctx, config.blockSize as number, config.amount as number, config.density as number),
}
```

**Position in array:** after Smear.

**Edge cases:** density=0 → no blocks displaced → no-op. blockSize larger than image → single block, displaced or not. Partial blocks at right/bottom edge: clamp pixel reads to image bounds.

---

## Chunk 6 — Bloom

**Status:** planned

**What it does:** Bright areas of the image bleed light outward. A multi-pass effect: extract bright pixels into a mask, blur the mask, additively blend it back.

**Config fields:**

| Key         | Type   | Default | Range | Label       |
| ----------- | ------ | ------- | ----- | ----------- |
| `threshold` | slider | 180     | 0–255 | Threshold   |
| `radius`    | slider | 8       | 1–20  | Radius      |
| `intensity` | slider | 100     | 0–200 | Intensity % |

**File to create:** `src/effects/applyBloom.ts`

```
export function applyBloom(ctx, threshold, radius, intensity): void
```

**Algorithm:**

1. `getImageData` → `srcData`
2. Build `maskData` (same size): for each pixel, if `luma >= threshold` copy RGB, else write 0s
3. Box-blur `maskData` in-place: run a horizontal pass then a vertical pass (each pixel = average of neighbors within `radius`). Repeat 3 times to approximate Gaussian.
4. Additive blend: `output[i] = clamp(srcData[i] + maskData[i] * (intensity / 100))`
5. `putImageData`

**Box blur helper:** implement as a local `boxBlurH` / `boxBlurV` pair operating on `Uint8ClampedArray`. Keep it in the same file.

**`index.ts` entry:**

```ts
{
  id: "bloom",
  name: "Bloom",
  fields: [
    { type: "slider", label: "Threshold", key: "threshold", defaultValue: 180, min: 0, max: 255, step: 1 },
    { type: "slider", label: "Radius", key: "radius", defaultValue: 8, min: 1, max: 20, step: 1 },
    { type: "slider", label: "Intensity %", key: "intensity", defaultValue: 100, min: 0, max: 200, step: 1 },
  ],
  apply: (ctx, config) =>
    applyBloom(ctx, config.threshold as number, config.radius as number, config.intensity as number),
}
```

**Position in array:** after Datamosh.

**Edge cases:** threshold=255 → empty mask → no bloom (fast path: skip blur). Large radius on large images is the slowest effect in the suite — 3 × 2-pass box blur at radius=20 on a 4K image can be slow; document this in a comment. intensity=0 → no-op after mask build.

---

## Chunk 7 — Mirror

**Status:** planned

**What it does:** Reflects one half of the image onto the other, creating symmetry. Stacked with RGB Shift or Jitter produces kaleidoscope-like results.

**Config fields:**

| Key    | Type     | Default | Range | Label                   |
| ------ | -------- | ------- | ----- | ----------------------- |
| `axis` | slider   | 0       | 0–2   | Axis (0=H, 1=V, 2=Both) |
| `flip` | checkbox | false   | —     | Flip source side        |

**File to create:** `src/effects/applyMirror.ts`

```
export function applyMirror(ctx, axis, flip): void
```

**Algorithm:**

- **Horizontal (axis=0):** for each row, copy the left half pixel `(x, y)` onto the mirrored position `(width-1-x, y)`. If `flip`: copy from right onto left instead.
- **Vertical (axis=1):** same idea top/bottom.
- **Both (axis=2):** apply horizontal mirror first, then vertical on the result.
- All operations on `ImageData` copied from the original (read from `srcData`, write to `newData`).

**`index.ts` entry:**

```ts
{
  id: "mirror",
  name: "Mirror",
  fields: [
    { type: "slider", label: "Axis (0=H 1=V 2=Both)", key: "axis", defaultValue: 0, min: 0, max: 2, step: 1 },
    { type: "checkbox", label: "Flip source side", key: "flip", defaultValue: false },
  ],
  apply: (ctx, config) => applyMirror(ctx, config.axis as number, config.flip as boolean),
}
```

**Position in array:** after Bloom.

**Edge cases:** axis slider uses integer steps (0/1/2); the label doubles as the legend. Odd-width images: the center column is copied from itself — acceptable.

---

## Chunk 8 — Dither

**Status:** planned

**What it does:** Reduces color depth to N shades, using either an ordered Bayer matrix or Floyd-Steinberg error diffusion. Produces a retro, pixelated aesthetic distinct from Pixelate.

**Config fields:**

| Key              | Type     | Default | Range | Label           |
| ---------------- | -------- | ------- | ----- | --------------- |
| `levels`         | slider   | 4       | 2–16  | Shades          |
| `errorDiffusion` | checkbox | false   | —     | Error diffusion |

**File to create:** `src/effects/applyDither.ts`

```
export function applyDither(ctx, levels, errorDiffusion): void
```

**Algorithm — Ordered (Bayer 4×4):**

1. `getImageData`
2. Define 4×4 Bayer matrix (values 0–15, normalized to 0–1 by dividing by 16)
3. For each pixel: compute `luma`; add `bayer[y%4][x%4]` as threshold offset; quantize to nearest of `levels` steps; apply quantized value to R, G, B (grayscale output)
4. `putImageData`

**Algorithm — Error Diffusion (Floyd-Steinberg):**

1. Copy pixel data into a `Float32Array` (need fractional precision)
2. Scan left-to-right, top-to-bottom
3. For each pixel: quantize `luma` to nearest level; compute `error = original - quantized`
4. Distribute error to neighbors: right `7/16`, bottom-left `3/16`, bottom `5/16`, bottom-right `1/16`
5. Write quantized value to R, G, B
6. `putImageData`

**`index.ts` entry:**

```ts
{
  id: "dither",
  name: "Dither",
  fields: [
    { type: "slider", label: "Shades", key: "levels", defaultValue: 4, min: 2, max: 16, step: 1 },
    { type: "checkbox", label: "Error diffusion", key: "errorDiffusion", defaultValue: false },
  ],
  apply: (ctx, config) => applyDither(ctx, config.levels as number, config.errorDiffusion as boolean),
}
```

**Position in array:** after Mirror.

**Edge cases:** levels=2 → binary black/white. levels=16 + error diffusion → subtle; may look almost like original. Both modes produce grayscale output — document this expectation.

---

## Chunk 9 — Vignette

**Status:** planned

**What it does:** Darkens the edges of the image toward the center, simulating a camera lens falloff. The subtlest effect in the suite — finishes compositions.

**Config fields:**

| Key       | Type   | Default | Range | Label   |
| --------- | ------ | ------- | ----- | ------- |
| `amount`  | slider | 50      | 0–100 | Amount  |
| `feather` | slider | 60      | 0–100 | Feather |

**File to create:** `src/effects/applyVignette.ts`

```
export function applyVignette(ctx, amount, feather): void
```

**Algorithm:**

1. `getImageData`
2. `cx = width / 2`, `cy = height / 2`, `maxDist = Math.sqrt(cx*cx + cy*cy)`
3. For each pixel:
   a. `dx = x - cx`, `dy = y - cy`
   b. `dist = Math.sqrt(dx*dx + dy*dy) / maxDist` (0 at center, 1 at corners)
   c. `start = feather / 100`, `end = 1.0`
   d. `t = smoothstep(start, end, dist)` where `smoothstep(a,b,x) = clamp((x-a)/(b-a),0,1)² × (3 - 2×clamp(...))`
   e. `factor = 1 - t * (amount / 100)`
   f. Multiply R, G, B by `factor`
4. `putImageData`

**`index.ts` entry:**

```ts
{
  id: "vignette",
  name: "Vignette",
  fields: [
    { type: "slider", label: "Amount", key: "amount", defaultValue: 50, min: 0, max: 100, step: 1 },
    { type: "slider", label: "Feather", key: "feather", defaultValue: 60, min: 0, max: 100, step: 1 },
  ],
  apply: (ctx, config) => applyVignette(ctx, config.amount as number, config.feather as number),
}
```

**Position in array:** after Dither.

**Edge cases:** amount=0 → factor=1 everywhere → no-op. feather=100 → vignette starts at center — very dramatic. feather=0 → hard circular cutoff at corners.

---

## Chunk 10 — Corrupt

**Status:** planned

**What it does:** Simulates raw byte-level data corruption — randomly copies short horizontal strips of pixels from wrong source positions within the same row. Differs from Datamosh (block-based) in that corruption events are narrow, line-level glitches. The two layer well together.

**Config fields:**

| Key          | Type   | Default | Range | Label       |
| ------------ | ------ | ------- | ----- | ----------- |
| `amount`     | slider | 20      | 0–100 | Amount      |
| `chunkWidth` | slider | 16      | 1–64  | Chunk width |

**File to create:** `src/effects/applyCorrupt.ts`

```
export function applyCorrupt(ctx, amount, chunkWidth): void
```

**Algorithm:**

1. `getImageData` → `srcData` (read-only copy), `newData` (starts as copy)
2. Compute `numEvents = Math.floor((width * height / 1000) * (amount / 100))` — scales events to image size
3. For each event:
   a. Pick random `y` (target row)
   b. Pick random `destX` (0 to width-1)
   c. Pick random `srcX` (0 to width-1, different from `destX`)
   d. Copy `chunkWidth` pixels from `(srcX, y)` to `(destX, y)` in `newData`, clamping both ranges to image bounds
4. `putImageData`

**`index.ts` entry:**

```ts
{
  id: "corrupt",
  name: "Corrupt",
  fields: [
    { type: "slider", label: "Amount", key: "amount", defaultValue: 20, min: 0, max: 100, step: 1 },
    { type: "slider", label: "Chunk width", key: "chunkWidth", defaultValue: 16, min: 1, max: 64, step: 1 },
  ],
  apply: (ctx, config) => applyCorrupt(ctx, config.amount as number, config.chunkWidth as number),
}
```

**Position in array:** after Vignette (last).

**Edge cases:** amount=0 → numEvents=0 → no-op. chunkWidth > width → clamp to width. srcX and destX may happen to be same position → harmless, just copies pixels onto themselves.

---

## Build order rationale

**Priority 1 — high payoff, low complexity:** Noise, Vignette, Hue Rotate, Mirror
These are pure pixel operations with no multi-pass or sorting. Each is 30–60 lines. Build these first to fill out the palette quickly.

**Priority 2 — iconic glitch core:** Pixel Sort, Smear, Corrupt
Single-pass, row-by-row algorithms. Each adds a distinctly different artifact type. Pixel Sort is the most visually recognizable.

**Priority 3 — multi-pass / complex:** Datamosh, Bloom, Dither
Datamosh and Bloom require temporary buffers. Bloom has the most complex implementation (box blur). Dither has two distinct algorithm branches. Build these last.
