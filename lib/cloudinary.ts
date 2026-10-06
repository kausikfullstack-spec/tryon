import { v2 as cloudinary } from "cloudinary";
export function cloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
function configure() {
  if (!cloudinaryConfigured())
    throw new Error(
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.",
    );
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
export async function uploadGlassesImage(bytes: Buffer, id: string) {
  configure();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: `glasstryon/glasses/${id}`,
        resource_type: "image",
        overwrite: false,
        allowed_formats: ["png", "jpg", "webp"],
        timeout: 60000,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new Error(
              "Cloudinary upload failed. Check credentials and try again.",
            ),
          );
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.on("error", () => reject(new Error("Cloudinary upload failed.")));
    stream.end(bytes);
  });
}
export async function destroyGlassesImage(publicId: string) {
  configure();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  if (!["ok", "not found"].includes(result.result))
    throw new Error("Cloudinary image removal failed.");
}
