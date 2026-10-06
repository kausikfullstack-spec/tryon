import { MongoClient } from "mongodb";

type CachedClient = { uri: string; promise: Promise<MongoClient> };
const cached = globalThis as typeof globalThis & {
  glassesMongo?: CachedClient;
};
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error("Set MONGODB_URI in .env.local to enable catalog storage.");
  if (!cached.glassesMongo || cached.glassesMongo.uri !== uri) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    const entry = { uri, promise: client.connect() };
    cached.glassesMongo = entry;
    entry.promise.catch(() => {
      if (cached.glassesMongo === entry) cached.glassesMongo = undefined;
      void client.close();
    });
  }
  return (await cached.glassesMongo.promise).db(
    process.env.MONGODB_DB || "glasstryon",
  );
}
