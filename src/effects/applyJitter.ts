export function applyJitter(
  ctx: CanvasRenderingContext2D,
  amount: number = 5,
  speed: number = 10,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  const clampedAmount = Math.max(0, Math.round(amount));
  const clampedSpeed = Math.max(0, speed);

  for (let y = 0; y < height; y++) {
    const wave = Math.sin((y * clampedSpeed) / height) * clampedAmount;
    const shift = Math.round(wave);

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
