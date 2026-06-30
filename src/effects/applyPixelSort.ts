function getLuma(data: Uint8ClampedArray, index: number): number {
  return (
    data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
  );
}

function sortSpan(
  data: Uint8ClampedArray,
  indices: number[],
  output: Uint8ClampedArray,
): void {
  const span = indices.map((index) => ({
    index,
    luma: getLuma(data, index),
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  }));

  span.sort((a, b) => a.luma - b.luma);

  for (let i = 0; i < span.length; i++) {
    const pixel = span[i];
    const destIndex = indices[i];
    output[destIndex] = pixel.r;
    output[destIndex + 1] = pixel.g;
    output[destIndex + 2] = pixel.b;
    output[destIndex + 3] = pixel.a;
  }
}

export function applyPixelSort(
  ctx: CanvasRenderingContext2D,
  threshold: number = 128,
  vertical: boolean = false,
  sortDark: boolean = false,
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  const majorMax = vertical ? width : height;
  const minorMax = vertical ? height : width;

  const getIndex = (minor: number, major: number): number =>
    vertical ? (minor * width + major) * 4 : (major * width + minor) * 4;

  for (let major = 0; major < majorMax; major++) {
    const spanIndices: number[] = [];
    let inSpan = false;

    for (let minor = 0; minor <= minorMax; minor++) {
      const endOfLine = minor === minorMax;
      const index = endOfLine ? -1 : getIndex(minor, major);
      const matches =
        !endOfLine &&
        (sortDark
          ? getLuma(data, index) < threshold
          : getLuma(data, index) >= threshold);

      if (matches && !inSpan) {
        inSpan = true;
        spanIndices.length = 0;
      }

      if (inSpan) {
        if (matches) {
          spanIndices.push(index);
        } else {
          sortSpan(data, spanIndices, output);
          inSpan = false;
          spanIndices.length = 0;
        }
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}
