import { test } from "node:test";
import assert from "node:assert/strict";
import { saveGlasses } from "../lib/save-glasses.ts";
const item = {
  id: "test-id",
  name: "Classic",
  category: "Eyeglasses",
  removeWhite: true,
};
const bytes = Buffer.from("photo");
test("stores Cloudinary URL and public ID in MongoDB while returning only public fields", async () => {
  let stored;
  const result = await saveGlasses(item, bytes, {
    upload: async (buffer, id) => {
      assert.equal(buffer, bytes);
      assert.equal(id, item.id);
      return {
        url: "https://res.cloudinary.com/test/frame.png",
        publicId: "glasses/frame",
      };
    },
    insert: async (record) => {
      stored = record;
    },
    destroy: async () => {
      assert.fail("Successful upload must not be removed");
    },
  });
  assert.equal(stored.cloudinaryPublicId, "glasses/frame");
  assert.equal(result.imageUrl, "https://res.cloudinary.com/test/frame.png");
  assert.ok(!("cloudinaryPublicId" in result));
});
test("removes uploaded image when database insertion fails", async () => {
  const removed = [];
  await assert.rejects(
    saveGlasses(item, bytes, {
      upload: async () => ({
        url: "https://example.test/frame.png",
        publicId: "glasses/frame",
      }),
      insert: async () => {
        throw new Error("Database unavailable");
      },
      destroy: async (id) => {
        removed.push(id);
      },
    }),
    /rolled back/,
  );
  assert.deepEqual(removed, ["glasses/frame"]);
});
test("does not insert a database record when Cloudinary fails", async () => {
  await assert.rejects(
    saveGlasses(item, bytes, {
      upload: async () => {
        throw new Error("Upload failed");
      },
      insert: async () => {
        assert.fail("No insertion on upload failure");
      },
      destroy: async () => {
        assert.fail("No asset to destroy");
      },
    }),
    /Upload failed/,
  );
});
