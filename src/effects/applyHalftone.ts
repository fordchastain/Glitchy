export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  dotSize: number = 6,
  angle: number = 45,
  invert: boolean = false,
): void {
  const { width, height } = ctx.canvas;

  // Sample the source once, then repaint the canvas from scratch: this effect
  // is a full re-render that draws dots directly with canvas primitives, so it
  // never putImageData's a pixel buffer back.
  const src = ctx.getImageData(0, 0, width, height).data;

  ctx.fillStyle = invert ? "#000" : "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = invert ? "#fff" : "#000";

  const spacing = Math.max(2, Math.round(dotSize));
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // A full-dark cell's dot just covers its cell (half-diagonal of the spacing).
  const maxR = spacing * Math.SQRT1_2;
  const diag = Math.ceil(Math.hypot(width, height));
  const hw = width / 2;
  const hh = height / 2;

  // Walk a lattice rotated by `angle` around the image center so the dot screen
  // sits at the chosen angle (classic halftone is 45°).
  for (let gy = -diag; gy < diag; gy += spacing) {
    for (let gx = -diag; gx < diag; gx += spacing) {
      const cx = hw + gx * cos - gy * sin;
      const cy = hh + gx * sin + gy * cos;
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

      const px = Math.min(width - 1, Math.round(cx));
      const py = Math.min(height - 1, Math.round(cy));
      const i = (py * width + px) * 4;
      const luma = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;

      const darkness = invert ? luma / 255 : 1 - luma / 255;
      // sqrt so the dot's *area* (not radius) scales with darkness.
      const r = maxR * Math.sqrt(darkness);

      if (r > 0.25) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
