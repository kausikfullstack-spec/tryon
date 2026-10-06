import { readFile } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/catalog";
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (!/^[a-f0-9-]{36}\.(json|png|jpg|webp)$/.test(file))
    return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(dataDir, "assets", file));
    const types: Record<string, string> = {
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      webp: "image/webp",
    };
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": types[file.split(".").pop()!],
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
