export function applySlices(
  ctx: CanvasRenderingContext2D,
  count: number = 10,
  offset: number = 20,
  verticalSpeed: number = 0,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  const clampedCount = Math.max(1, Math.min(Math.round(count), height));
  const sliceHeight = Math.floor(height / clampedCount);

  for (let y = 0; y < height; y++) {
    const sliceIndex = Math.min(Math.floor(y / sliceHeight), clampedCount - 1);
    const shift = Math.round(offset + sliceIndex * verticalSpeed);

    for (let x = 0; x < width; x++) {
      const srcX = (((x - shift) % width) + width) % width;
      const destI = (y * width + x) * 4;
      const srcI = (y * width + srcX) * 4;

      newData[destI] = data[srcI];
      newData[destI + 1] = data[srcI + 1];
      newData[destI + 2] = data[srcI + 2];
      newData[destI + 3] = data[srcI + 3];
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0);
}
