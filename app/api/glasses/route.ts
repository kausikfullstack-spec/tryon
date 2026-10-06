import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { catalog, dataDir, updateCatalog, type Glasses } from "@/lib/catalog";
import { isAdmin, sameOrigin } from "@/lib/admin";
export const runtime = "nodejs";
export async function GET() {
  return Response.json(await catalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: "Sign in as admin first." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 25 * 1024 * 1024)
    return Response.json(
      { error: "Upload is too large (25 MB maximum)." },
      { status: 413 },
    );
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const category = String(form.get("category") || "Eyeglasses");
    const image = form.get("image");
    if (!name || name.length > 100)
      throw new Error("Enter a name of 1–100 characters.");
    if (!["Eyeglasses", "Sunglasses"].includes(category))
      throw new Error("Invalid category.");
    const id = randomUUID();
    const item: Glasses = {
      id,
      name,
      category,
      removeWhite: form.get("removeWhite") === "on",
    };
    let imageBytes: Buffer | undefined, imageName: string | undefined;
    if (image instanceof File && image.size) {
      if (image.size > 4 * 1024 * 1024)
        throw new Error("Product image must be under 4 MB.");
      imageBytes = Buffer.from(await image.arrayBuffer());
      const png = imageBytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpg =
        imageBytes[0] === 255 && imageBytes[1] === 216 && imageBytes[2] === 255;
      const webp =
        imageBytes.toString("ascii", 0, 4) === "RIFF" &&
        imageBytes.toString("ascii", 8, 12) === "WEBP";
      if (!png && !jpg && !webp)
        throw new Error("Use a PNG, JPEG, or WebP product image.");
      imageName = `${id}.${png ? "png" : jpg ? "jpg" : "webp"}`;
      item.imageUrl = `/api/assets/${imageName}`;
    }
    if (!imageBytes) throw new Error("Upload a front-facing product photo.");
    await mkdir(path.join(dataDir, "assets"), { recursive: true });
    if (imageBytes && imageName)
      await writeFile(path.join(dataDir, "assets", imageName), imageBytes);
    await updateCatalog((items) => [...items, item]);
    return Response.json(item, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
              ? error.message
              : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: "Sign in as admin first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return Response.json({ error: "Missing glasses ID." }, { status: 400 });
  await updateCatalog((items) => items.filter((item) => item.id !== id));
  return Response.json({ ok: true });
}
