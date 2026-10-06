import { randomUUID } from "node:crypto";
import {
  catalog,
  glassesCollection,
  samples,
  type Glasses,
} from "@/lib/catalog";
import { isAdmin, sameOrigin } from "@/lib/admin";
import {
  cloudinaryConfigured,
  uploadGlassesImage,
  destroyGlassesImage,
} from "@/lib/cloudinary";
import { saveGlasses } from "@/lib/save-glasses";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json(await catalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Catalog unavailable. Configure MongoDB and check database access.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: "Sign in as admin first." }, { status: 401 });
  if (!process.env.MONGODB_URI || !cloudinaryConfigured())
    return Response.json(
      {
        error:
          "Configure MongoDB and Cloudinary in .env.local before uploading.",
      },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length")) > 5 * 1024 * 1024)
    return Response.json({ error: "Upload is too large." }, { status: 413 });
  let item: Glasses, bytes: Buffer;
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim(),
      category = String(form.get("category") || "Eyeglasses"),
      image = form.get("image");
    if (!name || name.length > 100)
      throw new Error("Enter a name of 1–100 characters.");
    if (!["Eyeglasses", "Sunglasses"].includes(category))
      throw new Error("Invalid category.");
    if (!(image instanceof File) || !image.size)
      throw new Error("Upload a front-facing product photo.");
    if (image.size > 4 * 1024 * 1024)
      throw new Error("Product image must be under 4 MB.");
    bytes = Buffer.from(await image.arrayBuffer());
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
    if (!png && !jpg && !webp)
      throw new Error("Use a PNG, JPEG, or WebP product image.");
    item = {
      id: randomUUID(),
      name,
      category,
      removeWhite: form.get("removeWhite") === "on",
    };
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid upload." },
      { status: 400 },
    );
  }
  try {
    // Connect before uploading so a database outage does not create orphan images.
    const collection = await glassesCollection();
    const saved = await saveGlasses(item, bytes, {
      upload: uploadGlassesImage,
      destroy: destroyGlassesImage,
      insert: async (record) => {
        await collection.insertOne({ ...record, _id: record.id });
      },
    });
    return Response.json(saved, { status: 201 });
  } catch {
    return Response.json(
      {
        error:
          "Could not save glasses. Check MongoDB and Cloudinary credentials and try again.",
      },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: "Sign in as admin first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return Response.json({ error: "Missing glasses ID." }, { status: 400 });
  try {
    const collection = await glassesCollection();
    const item = await collection.findOne({ _id: id });
    if (!item) {
      const sample = samples.find((frame) => frame.id === id);
      if (!sample)
        return Response.json({ error: "Glasses not found." }, { status: 404 });
      await collection.updateOne(
        { _id: id },
        { $setOnInsert: { ...sample, hidden: true } },
        { upsert: true },
      );
    } else if (item.cloudinaryPublicId) {
      await collection.updateOne(
        { _id: id },
        { $set: { pendingDelete: true } },
      );
      try {
        await destroyGlassesImage(item.cloudinaryPublicId);
      } catch {
        await collection.updateOne(
          { _id: id },
          { $unset: { pendingDelete: "" } },
        );
        throw new Error("Image removal failed.");
      }
      await collection.deleteOne({ _id: id });
    } else {
      await collection.updateOne({ _id: id }, { $set: { hidden: true } });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        error: "Could not remove glasses. Check storage connections and retry.",
      },
      { status: 503 },
    );
  }
}
