import type { Glasses } from "./catalog";

type Dependencies = {
  upload: (
    bytes: Buffer,
    id: string,
  ) => Promise<{ url: string; publicId: string }>;
  insert: (item: Glasses & { cloudinaryPublicId: string }) => Promise<void>;
  destroy: (publicId: string) => Promise<void>;
};
export async function saveGlasses(
  item: Glasses,
  bytes: Buffer,
  dependencies: Dependencies,
) {
  const image = await dependencies.upload(bytes, item.id);
  const saved = {
    ...item,
    imageUrl: image.url,
    cloudinaryPublicId: image.publicId,
  };
  try {
    await dependencies.insert(saved);
  } catch {
    try {
      await dependencies.destroy(image.publicId);
    } catch {
      throw new Error(
        "Catalog save and image cleanup failed. Check MongoDB and remove the unused image in Cloudinary.",
      );
    }
    throw new Error(
      "Catalog save failed. The image upload was rolled back; try again.",
    );
  }
  return { ...item, imageUrl: image.url };
}
