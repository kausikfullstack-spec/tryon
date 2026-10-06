import { database } from "./mongodb";

export type Glasses = {
  id: string;
  name: string;
  category: string;
  sku?: string;
  imageUrl?: string;
  removeWhite?: boolean;
  demo?: boolean;
};
export type StoredGlasses = Glasses & {
  _id: string;
  cloudinaryPublicId?: string;
  hidden?: boolean;
  pendingDelete?: boolean;
};
export async function glassesCollection() {
  return (await database()).collection<StoredGlasses>("glasses");
}
export const samples: Glasses[] = [
  {
    id: "aviator",
    name: "Aviator",
    category: "Sunglasses",
    sku: "rayban_aviator_or_vertFlash",
  },
  {
    id: "round",
    name: "Round copper",
    category: "Sunglasses",
    sku: "rayban_round_cuivre_pinkBrownDegrade",
  },
  {
    id: "carrera",
    name: "Carrera 113S",
    category: "Sunglasses",
    sku: "carrera_113S_blue",
  },
];
export async function catalog(): Promise<Glasses[]> {
  const stored = await (
    await glassesCollection()
  )
    .find({})
    .sort({ _id: 1 })
    .toArray();
  const records = new Map(stored.map((item) => [item.id, item]));
  const visibleSamples = samples.filter((item) => !records.has(item.id));
  return [
    ...visibleSamples,
    ...stored
      .filter((item) => !item.hidden && !item.pendingDelete)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        sku: item.sku,
        imageUrl: item.imageUrl,
        removeWhite: item.removeWhite,
        demo: item.demo,
      })),
  ];
}
export async function catalogState() {
  try {
    return { items: await catalog(), error: "" };
  } catch {
    return {
      items: samples,
      error: process.env.MONGODB_URI
        ? "MongoDB is unavailable. Check your connection settings and database access."
        : "Set MONGODB_URI in .env.local to enable catalog storage.",
    };
  }
}
