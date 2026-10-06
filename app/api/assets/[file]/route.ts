import { glassesCollection } from "@/lib/catalog";
// Keep old asset links working after migration without reading the local disk.
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const match = /^([a-f0-9-]{36})\.(png|jpg|webp)$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const item = await (
      await glassesCollection()
    ).findOne({
      _id: match[1],
      hidden: { $ne: true },
      pendingDelete: { $ne: true },
    });
    if (
      !item?.imageUrl ||
      !item.imageUrl.startsWith("https://res.cloudinary.com/")
    )
      return new Response("Not found", { status: 404 });
    return Response.redirect(item.imageUrl, 307);
  } catch {
    return new Response("Image storage unavailable", { status: 503 });
  }
}
