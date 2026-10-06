# Glasstryon

Next.js glasses fitting room based on the Jeeliz reference in D:/tryon, with a password-protected admin panel and persistent product-photo uploads.

## Run

1. Copy .env.example to .env.local and configure ADMIN_PASSWORD, MONGODB_URI, MONGODB_DB (defaults to glasstryon), CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET. Keep these credentials server-side. Use a MongoDB Atlas connection string or your own MongoDB deployment.
2. Run npm install then npm run dev.
3. Open http://localhost:3000 and http://localhost:3000/admin.

## Your glasses

Sign in at /admin, enter a frame name and category, and upload a PNG, JPEG, or WebP (maximum 4 MB). Your upload appears in the fitting room and persists after server restarts. Use a tightly cropped, front-facing transparent PNG for best results. Enable Remove white background for plain-white photos; this also removes white pixels inside lenses. Disable it for white frames or transparent images. Busy backgrounds and angled photos need editing first. Photo try-on is a 2D preview, not a reconstructed 3D model or physical fit measurement. Customers can adjust size and vertical position.

MediaPipe Face Landmarker runs locally in the browser with local WASM/model assets. Camera frames are not uploaded by the application. Start activates the camera; Stop and navigation stop it. Camera access requires localhost or HTTPS. Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

The three sample 3D frames use the supplied legacy Jeeliz engine and its remote services. They require internet access and WebGL, and remain subject to public/jeeliz/LICENSE. Uploaded photos use the independent MediaPipe mode.

## Try on a face photo

Choose **Try a face photo** in the fitting room and upload a clear, front-facing PNG, JPEG, or WebP with one face (up to 10 MB and 20 megapixels). Photo mode automatically selects a compatible frame; use **Choose glasses** above the preview to switch styles. If no product photos have been uploaded, three illustrative sample styles are available immediately. These are independent 2D samples, not pictures of the branded 3D demo models. Once you upload product photos in the admin panel, photo mode uses your own collection instead. Adjust size and vertical position and optionally download the preview. Face photos are processed only in the browser and are never stored on the server. Change or remove the photo with the controls above the preview. The legacy 3D demo frames support live-camera mode only.

## Persistent storage

Glasses metadata is stored in the MongoDB `glasses` collection. Product images are uploaded to Cloudinary, with their HTTPS URLs and Cloudinary public IDs saved in MongoDB. New uploads do not read or write the local data folder. MongoDB connections are pooled and reused. If database insertion fails after an image upload, the application attempts to remove the unused Cloudinary image. Removing uploaded glasses removes the Cloudinary asset and MongoDB record. Built-in 3D demo visibility is persisted in MongoDB. Product image requests use anonymous CORS so face-photo canvas previews and downloads work with Cloudinary. Customer face photos remain local to the browser.

Without MongoDB configuration or connectivity, the public fitting room remains usable with samples; admin displays the storage setup error. Uploads require both services to be configured. The database must allow connections from your app server. Deploy on a Node runtime; a writable local volume is no longer required. Admin sessions expire after eight hours and password changes invalidate them. Production requires HTTPS.

### Migrate existing local uploads

After configuring the credentials, run `npm run migrate:storage`. This reads the original `data/catalog.json`, uploads each product image to Cloudinary, and inserts the corresponding MongoDB record using the original ID. It skips records already migrated and preserves the original local files. If your legacy data is in another location, use `npm run migrate:storage -- D:/your/old/data`. Old `/api/assets/...` links redirect to the migrated Cloudinary URL. Run the migration before expecting your previous local uploads to appear in the new catalog. Removed built-in demos are preserved as hidden records. If MongoDB's final deletion fails after Cloudinary removal, the record stays hidden with `pendingDelete`; retry the DELETE request with its ID to finish cleanup.

Integration references: [MongoDB Node driver](https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/) and [Cloudinary Node uploads](https://cloudinary.com/documentation/node_image_and_video_upload).

## Validation

`node --test tests/mediapipe-logs.test.mjs` verifies that the native WASM logger routes the XNNPACK startup message to the informational console while preserving actual errors. The locally hosted MediaPipe loader files include this narrow correction so Next.js does not show a false error overlay. If you replace these files when upgrading MediaPipe, reapply it with `node scripts/patch-mediapipe-logs.mjs`.

npm run lint
npm run build
npm test
