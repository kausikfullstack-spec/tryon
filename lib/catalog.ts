import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type Glasses = {
  id: string;
  name: string;
  category: string;
  sku?: string;
  imageUrl?: string;
  removeWhite?: boolean;
  demo?: boolean;
};
export const dataDir = path.resolve(
  /* turbopackIgnore: true */ process.env.GLASSES_DATA_DIR ||
    path.join(process.cwd(), "data"),
);
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
  try {
    return JSON.parse(
      await readFile(path.join(dataDir, "catalog.json"), "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return samples;
    throw error;
  }
}
let queue = Promise.resolve();
export function updateCatalog(change: (items: Glasses[]) => Glasses[]) {
  const operation = queue.then(async () => {
    const items = change(await catalog());
    await mkdir(dataDir, { recursive: true });
    const temporary = path.join(dataDir, `${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(items, null, 2));
    await rename(temporary, path.join(dataDir, "catalog.json"));
    return items;
  });
  queue = operation.then(
    () => {},
    () => {},
  );
  return operation;
}
