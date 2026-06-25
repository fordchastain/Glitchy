export function applyPixelate(
  ctx: CanvasRenderingContext2D,
  blockSize: number = 8,
  grayscale: boolean = false,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const blockWidth = Math.max(1, Math.round(blockSize));

  for (let y = 0; y < height; y += blockWidth) {
    for (let x = 0; x < width; x += blockWidth) {
      const blockEndX = Math.min(x + blockWidth, width);
      const blockEndY = Math.min(y + blockWidth, height);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let by = y; by < blockEndY; by++) {
        for (let bx = x; bx < blockEndX; bx++) {
          const i = (by * width + bx) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      let avgR = Math.round(r / count);
      let avgG = Math.round(g / count);
      let avgB = Math.round(b / count);

      if (grayscale) {
        const lum = Math.round(0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB);
        avgR = lum;
        avgG = lum;
        avgB = lum;
      }

      for (let by = y; by < blockEndY; by++) {
        for (let bx = x; bx < blockEndX; bx++) {
          const i = (by * width + bx) * 4;
          data[i] = avgR;
          data[i + 1] = avgG;
          data[i + 2] = avgB;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
