import type { Glasses } from "./catalog";

// Illustrative styles for testing photo try-on before an admin uploads products.
// These are independent 2D samples, not images of the branded Jeeliz models.
export const photoSamples: Glasses[] = [
  {
    id: "photo-classic",
    name: "Classic square",
    category: "Eyeglasses",
    imageUrl: "/samples/classic.png",
    demo: true,
  },
  {
    id: "photo-round",
    name: "Round metal",
    category: "Eyeglasses",
    imageUrl: "/samples/round.png",
    demo: true,
  },
  {
    id: "photo-sun",
    name: "Everyday sunglasses",
    category: "Sunglasses",
    imageUrl: "/samples/sun.png",
    demo: true,
  },
];
