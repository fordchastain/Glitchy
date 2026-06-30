function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function applySmear(
  ctx: CanvasRenderingContext2D,
  amount: number = 40,
  vertical: boolean = false,
  threshold: number = 100,
): void {
  if (amount <= 0 || threshold > 255) return;

  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src);

  if (!vertical) {
    for (let y = 0; y < height; y++) {
      let bleedR = 0;
      let bleedG = 0;
      let bleedB = 0;
      let bleedLen = 0;

      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];

        if (luma(r, g, b) >= threshold) {
          bleedR = r;
          bleedG = g;
          bleedB = b;
          bleedLen = amount;
        } else if (bleedLen > 0) {
          dst[i] = bleedR;
          dst[i + 1] = bleedG;
          dst[i + 2] = bleedB;
          bleedLen--;
        }
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      let bleedR = 0;
      let bleedG = 0;
      let bleedB = 0;
      let bleedLen = 0;

      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];

        if (luma(r, g, b) >= threshold) {
          bleedR = r;
          bleedG = g;
          bleedB = b;
          bleedLen = amount;
        } else if (bleedLen > 0) {
          dst[i] = bleedR;
          dst[i + 1] = bleedG;
          dst[i + 2] = bleedB;
          bleedLen--;
        }
      }
    }
  }

  imageData.data.set(dst);
  ctx.putImageData(imageData, 0, 0);
}
