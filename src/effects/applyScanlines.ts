export function applyScanlines(
  ctx: CanvasRenderingContext2D,
  darkness: number = 0.7,
  vertical: boolean = false,
  scale: number = 1,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (vertical) {
    for (let x = 0; x < width; x++) {
      const shouldDarken = Math.floor(x / scale) % 2 === 0;
      if (shouldDarken) {
        for (let y = 0; y < height; y++) {
          const i = (y * width + x) * 4;
          data[i] *= darkness;
          data[i + 1] *= darkness;
          data[i + 2] *= darkness;
        }
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      const shouldDarken = Math.floor(y / scale) % 2 === 0;
      if (shouldDarken) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          data[i] *= darkness;
          data[i + 1] *= darkness;
          data[i + 2] *= darkness;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
