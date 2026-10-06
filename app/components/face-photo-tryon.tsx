"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { Glasses } from "@/lib/catalog";
import { prepareGlassesImage } from "./glasses-image";

type FacePhoto = { image: HTMLCanvasElement; landmarks: NormalizedLandmark[] };

export default function FacePhotoTryon({
  glasses,
  photoUrl,
}: {
  glasses: Glasses;
  photoUrl: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<FacePhoto>();
  const [cutout, setCutout] = useState<HTMLCanvasElement>();
  const [faceStatus, setFaceStatus] = useState("Loading your photo…");
  const [frameStatus, setFrameStatus] = useState("Loading glasses…");
  const [scale, setScale] = useState(1),
    [offset, setOffset] = useState(0);

  useEffect(() => {
    let disposed = false;
    async function detectFace() {
      let detector: FaceLandmarker | undefined;
      try {
        const image = new window.Image();
        image.src = photoUrl;
        await image.decode();
        if (disposed) return;
        if (image.width * image.height > 20000000)
          throw new Error("Choose a smaller face photo (under 20 megapixels).");
        const source = document.createElement("canvas"),
          ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
        source.width = Math.round(image.width * ratio);
        source.height = Math.round(image.height * ratio);
        source
          .getContext("2d")!
          .drawImage(image, 0, 0, source.width, source.height);
        const preview = canvas.current!;
        preview.width = source.width;
        preview.height = source.height;
        preview.getContext("2d")!.drawImage(source, 0, 0);
        setFaceStatus("Finding your face…");
        const files = await FilesetResolver.forVisionTasks("/mediapipe");
        if (disposed) return;
        detector = await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
          runningMode: "IMAGE",
          numFaces: 2,
        });
        if (disposed) return;
        const faces = detector.detect(source).faceLandmarks;
        if (!faces.length)
          throw new Error(
            "No face found. Choose a clear, front-facing photo with good lighting.",
          );
        if (faces.length > 1)
          throw new Error("Choose a photo with just one face.");
        setPhoto({ image: source, landmarks: faces[0] });
        setFaceStatus("");
      } catch (error) {
        if (!disposed)
          setFaceStatus(
            error instanceof Error
              ? error.name === "EncodingError"
                ? "Could not read this photo. Choose a valid PNG, JPEG, or WebP."
                : error.message
              : "Could not read this photo. Choose a PNG, JPEG, or WebP.",
          );
      } finally {
        detector?.close();
      }
    }
    void detectFace();
    return () => {
      disposed = true;
    };
  }, [photoUrl]);

  useEffect(() => {
    let disposed = false;
    async function loadFrame() {
      try {
        const image = await prepareGlassesImage(glasses);
        if (!disposed) {
          setCutout(image);
          setFrameStatus("");
        }
      } catch (error) {
        if (!disposed) {
          setCutout(undefined);
          setFrameStatus(
            error instanceof Error ? error.message : "Could not load glasses.",
          );
        }
      }
    }
    void loadFrame();
    return () => {
      disposed = true;
    };
  }, [glasses]);

  useEffect(() => {
    if (!photo || !canvas.current) return;
    const c = canvas.current;
    c.width = photo.image.width;
    c.height = photo.image.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(photo.image, 0, 0);
    if (!cutout || frameStatus) return;
    const a = photo.landmarks[33],
      b = photo.landmarks[263];
    const dx = (b.x - a.x) * c.width,
      dy = (b.y - a.y) * c.height;
    const width = Math.hypot(dx, dy) * 1.65 * scale,
      height = (width * cutout.height) / cutout.width;
    ctx.save();
    ctx.translate(
      ((a.x + b.x) / 2) * c.width,
      ((a.y + b.y) / 2) * c.height + offset * width,
    );
    ctx.rotate(Math.atan2(dy, dx));
    ctx.drawImage(cutout, -width / 2, -height / 2, width, height);
    ctx.restore();
  }, [photo, cutout, scale, offset, frameStatus]);

  // Never show a previous frame while the next product image is being loaded.
  const ready = !!photo && !!cutout && !faceStatus && !frameStatus;
  const status =
    faceStatus ||
    frameStatus ||
    "Glasses fitted · adjust the size and position below";
  return (
    <div className="photo-viewer still-viewer">
      <div className="face-photo-preview">
        <canvas
          ref={canvas}
          aria-label={`Your face photo with ${glasses.name}`}
        />
        <p className="camera-status" role="status">
          {status}
        </p>
      </div>
      <div className="fit-controls">
        <label>
          Frame size
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.01"
            value={scale}
            disabled={!ready}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </label>
        <label>
          Vertical position
          <input
            type="range"
            min="-0.3"
            max="0.3"
            step="0.01"
            value={offset}
            disabled={!ready}
            onChange={(e) => setOffset(Number(e.target.value))}
          />
        </label>
        <button
          className="secondary"
          disabled={!ready}
          onClick={() => {
            setScale(1);
            setOffset(0);
          }}
        >
          Reset fit
        </button>
        <button
          className="secondary"
          disabled={!ready}
          onClick={() => {
            const link = document.createElement("a");
            link.download = "glasstryon-preview.png";
            link.href = canvas.current!.toDataURL("image/png");
            link.click();
          }}
        >
          Download preview
        </button>
      </div>
    </div>
  );
}
