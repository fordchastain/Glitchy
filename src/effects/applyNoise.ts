import { createRng } from "./random";

export function applyNoise(
  ctx: CanvasRenderingContext2D,
  amount: number = 30,
  color: boolean = false,
): void {
  if (amount <= 0) return;

  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const rng = createRng(0x9e3779b9);

  for (let i = 0; i < data.length; i += 4) {
    if (color) {
      data[i] += (rng() * 2 - 1) * amount;
      data[i + 1] += (rng() * 2 - 1) * amount;
      data[i + 2] += (rng() * 2 - 1) * amount;
    } else {
      const offset = (rng() * 2 - 1) * amount;
      data[i] += offset;
      data[i + 1] += offset;
      data[i + 2] += offset;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
