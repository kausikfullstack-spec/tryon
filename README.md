# Glasstryon

Next.js glasses fitting room based on the Jeeliz reference in D:/tryon, with a password-protected admin panel and persistent product-photo uploads.

## Run

1. Copy .env.example to .env.local and set your private ADMIN_PASSWORD.
2. Run npm install then npm run dev.
3. Open http://localhost:3000 and http://localhost:3000/admin.

## Your glasses

Sign in at /admin, enter a frame name and category, and upload a PNG, JPEG, or WebP (maximum 4 MB). Your upload appears in the fitting room and persists after server restarts. Use a tightly cropped, front-facing transparent PNG for best results. Enable Remove white background for plain-white photos; this also removes white pixels inside lenses. Disable it for white frames or transparent images. Busy backgrounds and angled photos need editing first. Photo try-on is a 2D preview, not a reconstructed 3D model or physical fit measurement. Customers can adjust size and vertical position.

MediaPipe Face Landmarker runs locally in the browser with local WASM/model assets. Camera frames are not uploaded by the application. Start activates the camera; Stop and navigation stop it. Camera access requires localhost or HTTPS. Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

The three sample 3D frames use the supplied legacy Jeeliz engine and its remote services. They require internet access and WebGL, and remain subject to public/jeeliz/LICENSE. Uploaded photos use the independent MediaPipe mode.

## Try on a face photo

Choose **Try a face photo** in the fitting room and upload a clear, front-facing PNG, JPEG, or WebP with one face (up to 10 MB and 20 megapixels). Photo mode automatically selects a compatible frame; use **Choose glasses** above the preview to switch styles. If no product photos have been uploaded, three illustrative sample styles are available immediately. These are independent 2D samples, not pictures of the branded 3D demo models. Once you upload product photos in the admin panel, photo mode uses your own collection instead. Adjust size and vertical position and optionally download the preview. Face photos are processed only in the browser and are never stored on the server. Change or remove the photo with the controls above the preview. The legacy 3D demo frames support live-camera mode only.

## Persistent storage

Catalog and images are stored under data/ (ignored by Git). Set GLASSES_DATA_DIR to use another location. Deploy on a Node server with writable durable storage, or mount a persistent volume; ephemeral serverless storage will not retain uploads. Back up this directory. Removing a frame removes its catalog entry; original assets remain on disk. Admin sessions expire after eight hours and password changes invalidate them. Production requires HTTPS.

## Validation

`node --test tests/mediapipe-logs.test.mjs` verifies that the native WASM logger routes the XNNPACK startup message to the informational console while preserving actual errors. The locally hosted MediaPipe loader files include this narrow correction so Next.js does not show a false error overlay. If you replace these files when upgrading MediaPipe, reapply it with `node scripts/patch-mediapipe-logs.mjs`.

npm run lint
npm run build
