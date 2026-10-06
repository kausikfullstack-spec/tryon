"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Glasses } from "@/lib/catalog";
import PhotoTryon from "./photo-tryon";
import FacePhotoTryon from "./face-photo-tryon";
import { photoSamples } from "@/lib/photo-samples";
export function FrameIcon() {
  return (
    <svg viewBox="0 0 200 80" fill="none" aria-hidden="true">
      <path
        d="M10 29L25 34M175 34L190 29M85 34Q100 24 115 34"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="25"
        y="20"
        width="60"
        height="43"
        rx="16"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="115"
        y="20"
        width="60"
        height="43"
        rx="16"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}
export default function Storefront({ items }: { items: Glasses[] }) {
  const [choice, setSelected] = useState(items[0]),
    [active, setActive] = useState(false),
    [filter, setFilter] = useState("All frames"),
    [mode, setMode] = useState<"camera" | "photo">("camera"),
    [photoUrl, setPhotoUrl] = useState(""),
    [photoError, setPhotoError] = useState("");
  const uploadedFrames = items.filter((item) => item.imageUrl);
  // Keep the real catalog visible in both modes; fallback styles are additional.
  const collection = [
    ...items,
    ...(mode === "photo" && !uploadedFrames.length ? photoSamples : []),
  ];
  const compatibleFrames =
    mode === "photo" ? collection.filter((item) => item.imageUrl) : collection;
  const selected =
    compatibleFrames.find((item) => item.id === choice?.id) ||
    compatibleFrames[0];
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );
  function uploadFace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a PNG, JPEG, or WebP face photo.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Choose a face photo under 10 MB.");
      return;
    }
    setPhotoError("");
    setPhotoUrl(URL.createObjectURL(file));
    setActive(false);
  }
  const visible = collection.filter(
    (item) => filter === "All frames" || item.category === filter,
  );
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          glass<span>tryon</span>
          <b>●</b>
        </Link>
        <nav>
          <span>Find your everyday frame</span>
          <Link className="secondary" href="/admin">
            Admin panel ↗
          </Link>
        </nav>
      </header>
      <main className="store">
        <div className="intro">
          <div>
            <p className="eyebrow">YOUR FRAMES. YOUR FACE.</p>
            <h1>
              A new way to
              <br />
              see yourself.
            </h1>
            <p className="muted">
              Find the pair that feels like you.
              <br />
              Try your favorite glasses on, right here.
            </p>
          </div>
          <div className="intro-note">
            <span>01 / EXPLORE</span>
            <p>
              Choose a frame.
              <br />
              Use your camera or photo.
              <br />
              Meet your next favorite.
            </p>
          </div>
        </div>
        <div className="tryon-layout">
          <section className="viewer-panel">
            <div className="viewer-header">
              <span>
                ●{" "}
                {mode === "photo"
                  ? "PHOTO FITTING ROOM"
                  : active
                    ? "LIVE TRY-ON"
                    : "VIRTUAL FITTING ROOM"}
              </span>
              <span>{selected?.sku ? "3D try-on" : "Photo try-on"}</span>
            </div>
            <div className="tryon-options">
              <div className="mode-switch" aria-label="Try-on mode">
                <button
                  className={mode === "camera" ? "selected" : ""}
                  aria-pressed={mode === "camera"}
                  onClick={() => {
                    setMode("camera");
                    setActive(false);
                  }}
                >
                  Use camera
                </button>
                <button
                  className={mode === "photo" ? "selected" : ""}
                  aria-pressed={mode === "photo"}
                  onClick={() => {
                    setMode("photo");
                    setActive(false);
                  }}
                >
                  Try a face photo
                </button>
              </div>
              {mode === "photo" && (
                <div className="face-upload">
                  <label className="secondary upload-face-label">
                    {photoUrl ? "Change face photo" : "Upload face photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label="Upload face photo"
                      onChange={uploadFace}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setPhotoUrl("");
                        setPhotoError("");
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              )}
              {mode === "photo" && (
                <label className="photo-frame-picker">
                  Choose glasses
                  <select
                    value={selected?.id || ""}
                    onChange={(event) => {
                      const frame = collection.find(
                        (item) => item.id === event.target.value,
                      );
                      if (frame) setSelected(frame);
                    }}
                  >
                    {compatibleFrames.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.demo ? " (sample)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {mode === "photo" && !uploadedFrames.length && (
                <p className="field-help">
                  Try these sample styles now.{" "}
                  <Link href="/admin">
                    Upload your own glasses in the admin panel
                  </Link>{" "}
                  to replace them with your collection.
                </p>
              )}
              {mode === "photo" && (
                <p className="field-help">
                  Use a clear photo with one face, looking forward. PNG, JPEG,
                  or WebP, up to 10 MB. Your photo stays on your device.
                </p>
              )}
              {photoError && (
                <p className="photo-error" role="alert">
                  {photoError}
                </p>
              )}
            </div>
            <div className="viewer-stage">
              {mode === "photo" ? (
                photoUrl && selected?.imageUrl ? (
                  <FacePhotoTryon
                    key={`${photoUrl}:${selected.id}`}
                    glasses={selected}
                    photoUrl={photoUrl}
                  />
                ) : (
                  <div className="camera-placeholder">
                    <div className="face-outline">
                      <FrameIcon />
                    </div>
                    <h2>
                      {photoUrl
                        ? "Choose your uploaded glasses."
                        : "Try your frames on a photo."}
                    </h2>
                    <p>
                      {photoUrl
                        ? "Select glasses with a product photo from the collection. The 3D demo frames support camera try-on."
                        : "Upload a face photo above, then choose a frame from your collection."}
                    </p>
                    {!items.some((item) => item.imageUrl) && (
                      <p>
                        Add your glasses from the{" "}
                        <Link href="/admin">admin panel</Link> to try them on
                        your photo.
                      </p>
                    )}
                  </div>
                )
              ) : active && selected ? (
                selected.sku ? (
                  <iframe
                    key={selected.id}
                    title={`Try on ${selected.name}`}
                    src={`/jeeliz/viewer.html?sku=${encodeURIComponent(selected.sku)}`}
                    allow="camera"
                  />
                ) : (
                  <PhotoTryon key={selected.id} glasses={selected} />
                )
              ) : (
                <div className="camera-placeholder">
                  <div className="face-outline">
                    <FrameIcon />
                  </div>
                  <h2>Your perfect fit starts here.</h2>
                  <p>
                    Allow your camera to see the frames on you.
                    <br />
                    Your camera stays on your device.
                  </p>
                  <button disabled={!selected} onClick={() => setActive(true)}>
                    {selected
                      ? "Start virtual try-on ↗"
                      : "Add frames in the admin panel"}
                  </button>
                  <small>Works best in good lighting, facing forward.</small>
                </div>
              )}
            </div>
            <div className="viewer-footer">
              <div>
                <p className="eyebrow">CURRENT FRAME</p>
                <h3>{selected?.name || "No frames yet"}</h3>
              </div>
              {mode === "camera" && active && (
                <button className="secondary" onClick={() => setActive(false)}>
                  Stop camera
                </button>
              )}
              <span className="privacy">
                ◎{" "}
                {mode === "photo"
                  ? "Photo stays private"
                  : "Camera stays private"}
              </span>
            </div>
          </section>
          <aside className="catalog-panel">
            <div className="catalog-heading">
              <h2>The collection</h2>
              <span>{collection.length} frames</span>
            </div>
            <div className="filters">
              {["All frames", "Eyeglasses", "Sunglasses"].map((value) => (
                <button
                  className={filter === value ? "selected" : ""}
                  key={value}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="frame-list">
              {visible.map((item) => (
                <button
                  key={item.id}
                  className={`frame-card ${selected?.id === item.id ? "chosen" : ""}`}
                  onClick={() => {
                    setSelected(item);
                    if (mode === "photo" && !item.imageUrl) {
                      setMode("camera");
                      setActive(false);
                    }
                  }}
                >
                  <div className="frame-art">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={280}
                        height={100}
                        unoptimized
                      />
                    ) : (
                      <FrameIcon />
                    )}
                  </div>
                  <div className="frame-info">
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.category} ·{" "}
                        {item.sku
                          ? "3D demo"
                          : item.demo
                            ? "Photo sample"
                            : "Your upload"}
                      </small>
                      {mode === "photo" && !item.imageUrl && (
                        <small>Try with camera</small>
                      )}
                    </span>
                    <span className="select-circle">
                      {selected?.id === item.id ? "✓" : "↗"}
                    </span>
                  </div>
                </button>
              ))}
              {!visible.length && (
                <p className="muted">No frames in this collection yet.</p>
              )}
            </div>
            <div className="collection-note">
              <strong>Made for your collection.</strong>
              <p>
                Add your own glasses from the{" "}
                <Link href="/admin">admin panel</Link> and try them on here.
              </p>
            </div>
          </aside>
        </div>
        <footer className="site-footer">
          <span>GLASSTRYON / SEE WHAT SUITS YOU</span>
          <span>
            Photo frames track your face in 2D. Fit is a visual preview.
          </span>
        </footer>
      </main>
    </>
  );
}
