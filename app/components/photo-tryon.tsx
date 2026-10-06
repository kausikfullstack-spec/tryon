"use client";
import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Glasses } from "@/lib/catalog";
import { prepareGlassesImage } from "./glasses-image";
export default function PhotoTryon({ glasses }: { glasses: Glasses }) {
  const video = useRef<HTMLVideoElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Starting camera…"),
    [scale, setScale] = useState(1),
    [offset, setOffset] = useState(0);
  const fit = useRef({ scale, offset });
  useEffect(() => {
    fit.current = { scale, offset };
  }, [scale, offset]);
  useEffect(() => {
    let disposed = false,
      frame = 0,
      stream: MediaStream | undefined,
      detector: FaceLandmarker | undefined;
    const cleanup = () => {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      detector?.close();
      detector = undefined;
    };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("Camera requires HTTPS or localhost.");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 960, height: 720 },
          audio: false,
        });
        if (disposed) {
          cleanup();
          return;
        }
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        if (disposed) {
          cleanup();
          return;
        }
        setStatus("Loading face tracking…");
        const files = await FilesetResolver.forVisionTasks("/mediapipe");
        if (disposed) {
          cleanup();
          return;
        }
        detector = await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (disposed) {
          cleanup();
          return;
        }
        const cutout = await prepareGlassesImage(glasses);
        if (disposed) {
          cleanup();
          return;
        }
        const left = 0,
          top = 0,
          width = cutout.width,
          height = cutout.height;
        let lastTime = -1,
          lastStatus = "";
        const render = () => {
          if (disposed) return;
          try {
            if (v.readyState >= 2 && v.currentTime !== lastTime) {
              lastTime = v.currentTime;
              const c = canvas.current!;
              if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
                c.width = v.videoWidth;
                c.height = v.videoHeight;
              }
              const draw = c.getContext("2d")!;
              draw.clearRect(0, 0, c.width, c.height);
              const face = detector!.detectForVideo(v, performance.now()).faceLandmarks[0];
              const message = face
                ? "Face detected · move naturally"
                : "Look straight at the camera";
              if (lastStatus !== message) {
                lastStatus = message;
                setStatus(message);
              }
              if (face) {
                const a = face[33],
                  b = face[263],
                  dx = (b.x - a.x) * c.width,
                  dy = (b.y - a.y) * c.height,
                  w = Math.hypot(dx, dy) * 1.65 * fit.current.scale,
                  h = (w * height) / width;
                draw.save();
                draw.translate(
                  ((a.x + b.x) / 2) * c.width,
                  ((a.y + b.y) / 2) * c.height + fit.current.offset * w,
                );
                draw.rotate(Math.atan2(dy, dx));
                draw.drawImage(
                  cutout,
                  left,
                  top,
                  width,
                  height,
                  -w / 2,
                  -h / 2,
                  w,
                  h,
                );
                draw.restore();
              }
            }
            frame = requestAnimationFrame(render);
          } catch {
            setStatus("Tracking stopped. Stop the camera and try again.");
            cleanup();
          }
        };
        render();
      } catch (error) {
        if (!disposed)
          setStatus(
            error instanceof Error
              ? error.name === "NotAllowedError"
                ? "Allow camera access, then stop and restart try-on."
                : error.message
              : "Could not start camera.",
          );
        cleanup();
      }
    }
    void start();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [glasses]);
  return (
    <div className="photo-viewer">
      <div className="camera-layers">
        <video ref={video} muted playsInline />
        <canvas ref={canvas} />
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
            onChange={(e) => setOffset(Number(e.target.value))}
          />
        </label>
        <button
          className="secondary"
          onClick={() => {
            setScale(1);
            setOffset(0);
          }}
        >
          Reset fit
        </button>
      </div>
    </div>
  );
}
