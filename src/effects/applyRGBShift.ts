export function applyRGBShift(
  ctx: CanvasRenderingContext2D,
  amount: number = 5,
  shiftGreen: boolean = false,
  direction: number = 0,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  const rad = (direction * Math.PI) / 180;
  const dx = Math.round(Math.cos(rad) * amount);
  const dy = Math.round(Math.sin(rad) * amount);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const sx = x + dx;
      const sy = y + dy;

      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const shiftIndex = (sy * width + sx) * 4;
        newData[i] = data[shiftIndex]; // Shift red channel
        if (shiftGreen) {
          newData[i + 1] = data[shiftIndex + 1]; // Shift green too
        } else {
          newData[i + 1] = data[i + 1]; // Keep green
        }
        newData[i + 2] = data[i + 2]; // Keep blue
      }
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0);
}
