import { readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
for (const key of [
  "MONGODB_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]) {
  if (!process.env[key])
    throw new Error(`Set ${key} in .env.local before migration.`);
}
const directory = path.resolve(process.argv[2] || "data");
const items = JSON.parse(
  await readFile(path.join(directory, "catalog.json"), "utf8"),
);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
});
try {
  await client.connect();
  const collection = client
    .db(process.env.MONGODB_DB || "glasstryon")
    .collection("glasses");
  const originalIds = new Set(items.map((item) => item.id));
  for (const id of ["aviator", "round", "carrera"]) {
    if (!originalIds.has(id))
      await collection.updateOne(
        { _id: id },
        {
          $setOnInsert: { id, name: id, category: "Sunglasses", hidden: true },
        },
        { upsert: true },
      );
  }
  for (const item of items) {
    if (await collection.findOne({ _id: item.id })) {
      console.log(`Already migrated: ${item.name}`);
      continue;
    }
    const record = { ...item, _id: item.id };
    let uploadedId;
    if (item.imageUrl?.startsWith("/api/assets/")) {
      const filename = item.imageUrl.slice("/api/assets/".length);
      if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(filename))
        throw new Error(`Invalid legacy filename for ${item.name}`);
      const result = await cloudinary.uploader.upload(
        path.join(directory, "assets", filename),
        {
          public_id: `glasstryon/migrated/${item.id}`,
          resource_type: "image",
          overwrite: false,
        },
      );
      record.imageUrl = result.secure_url;
      record.cloudinaryPublicId = result.public_id;
      uploadedId = result.public_id;
    }
    try {
      await collection.insertOne(record);
    } catch (error) {
      if (uploadedId)
        await cloudinary.uploader.destroy(uploadedId, { invalidate: true });
      throw error;
    }
    console.log(`Migrated: ${item.name}`);
  }
  console.log("Migration complete. Original local files were preserved.");
} finally {
  await client.close();
}
