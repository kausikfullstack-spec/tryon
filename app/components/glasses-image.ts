import type { Glasses } from "@/lib/catalog";

// Normalize product photos for both live-camera and still-image try-on.
export async function prepareGlassesImage(glasses: Glasses) {
  if (!glasses.imageUrl)
    throw new Error("Choose glasses with an uploaded product photo.");
  const image = new window.Image();
  image.src = glasses.imageUrl;
  await image.decode();
  if (image.width * image.height > 20000000)
    throw new Error("Upload a smaller product image (under 20 megapixels).");
  const source = document.createElement("canvas");
  const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
  source.width = Math.round(image.width * ratio);
  source.height = Math.round(image.height * ratio);
  const ctx = source.getContext("2d")!;
  ctx.drawImage(image, 0, 0, source.width, source.height);
  const pixels = ctx.getImageData(0, 0, source.width, source.height);
  let left = source.width,
    top = source.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const i = (y * source.width + x) * 4;
      if (
        glasses.removeWhite &&
        pixels.data[i] > 230 &&
        pixels.data[i + 1] > 230 &&
        pixels.data[i + 2] > 230
      )
        pixels.data[i + 3] = 0;
      if (pixels.data[i + 3] > 20) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top)
    throw new Error("No visible glasses found in the product photo.");
  ctx.putImageData(pixels, 0, 0);
  const cropped = document.createElement("canvas");
  cropped.width = right - left + 1;
  cropped.height = bottom - top + 1;
  cropped
    .getContext("2d")!
    .drawImage(
      source,
      left,
      top,
      cropped.width,
      cropped.height,
      0,
      0,
      cropped.width,
      cropped.height,
    );
  return cropped;
}
