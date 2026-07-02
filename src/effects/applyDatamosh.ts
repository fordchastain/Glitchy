export function applyDatamosh(
  ctx: CanvasRenderingContext2D,
  blockSize: number = 16,
  amount: number = 40,
  density: number = 30,
): void {
  if (density <= 0 || amount <= 0) return;

  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src);

  const cols = Math.ceil(width / blockSize);
  const rows = Math.ceil(height / blockSize);
  const threshold = density / 100;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > threshold) continue;

      const dx = (Math.random() * 2 - 1) * amount;
      const dy = (Math.random() * 2 - 1) * amount;
      const srcCol = Math.max(
        0,
        Math.min(cols - 1, col + Math.round((dx * cols) / 100)),
      );
      const srcRow = Math.max(
        0,
        Math.min(rows - 1, row + Math.round((dy * rows) / 100)),
      );

      const dstX = col * blockSize;
      const dstY = row * blockSize;
      const srcX = srcCol * blockSize;
      const srcY = srcRow * blockSize;
      const blockW = Math.min(blockSize, width - dstX);
      const blockH = Math.min(blockSize, height - dstY);

      for (let y = 0; y < blockH; y++) {
        for (let x = 0; x < blockW; x++) {
          const sx = Math.min(srcX + x, width - 1);
          const sy = Math.min(srcY + y, height - 1);
          const srcI = (sy * width + sx) * 4;
          const dstI = ((dstY + y) * width + (dstX + x)) * 4;

          dst[dstI] = src[srcI];
          dst[dstI + 1] = src[srcI + 1];
          dst[dstI + 2] = src[srcI + 2];
        }
      }
    }
  }

  imageData.data.set(dst);
  ctx.putImageData(imageData, 0, 0);
}
