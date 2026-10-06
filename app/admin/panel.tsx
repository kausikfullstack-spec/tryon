"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Glasses } from "@/lib/catalog";
export default function AdminPanel({
  authenticated,
  items,
  configured,
}: {
  authenticated: boolean;
  items: Glasses[];
  configured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        authenticated ? "/api/glasses" : "/api/admin/session",
        { method: "POST", body: new FormData(form) },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      form.reset();
      setMessage(
        authenticated
          ? "Glasses uploaded. They are now available in the fitting room."
          : "Signed in.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove these glasses from the collection?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/glasses?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error((await response.json()).error);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not remove glasses.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          glass<span>tryon</span>
          <b>●</b>
        </Link>
        <Link className="secondary" href="/">
          ← Fitting room
        </Link>
      </header>
      <main className="admin-main">
        <p className="eyebrow">COLLECTION MANAGER</p>
        <h1>
          Your glasses,
          <br />
          in the spotlight.
        </h1>
        <p className="muted">
          Upload your own frames and make them available for virtual try-on.
        </p>
        {!authenticated ? (
          <form className="admin-form login" onSubmit={submit}>
            <h2>Admin sign in</h2>
            {!configured && (
              <p className="notice">
                Set ADMIN_PASSWORD in .env.local, then restart the server to
                enable admin access.
              </p>
            )}
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button disabled={busy || !configured}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="admin-grid">
            <form className="admin-form" onSubmit={submit}>
              <h2>Add your glasses</h2>
              <label>
                Frame name
                <input
                  name="name"
                  required
                  maxLength={100}
                  placeholder="e.g. Everyday black acetate"
                />
              </label>
              <label>
                Category
                <select name="category">
                  <option>Eyeglasses</option>
                  <option>Sunglasses</option>
                </select>
              </label>
              <label>
                Product photo
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg,image/webp"
                  required
                />
              </label>
              <p className="field-help">
                Front-facing PNG, JPEG, or WebP, up to 4 MB. Crop closely around
                the glasses. A transparent PNG gives the best result.
              </p>
              <label className="checkbox">
                <input type="checkbox" name="removeWhite" defaultChecked />
                Remove white background for try-on
              </label>
              <p className="field-help">
                For a plain white background. This also removes white areas
                inside lenses. Turn it off for transparent images or white
                frames. Angled photos and busy backgrounds need editing first.
              </p>
              <button disabled={busy}>
                {busy ? "Uploading…" : "Upload glasses ↗"}
              </button>
            </form>
            <section className="admin-list">
              <div className="catalog-heading">
                <h2>Your collection</h2>
                <span>{items.length} frames</span>
              </div>
              {items.map((item) => (
                <div className="admin-row" key={item.id}>
                  {item.imageUrl && <Image src={item.imageUrl} alt={item.name} width={65} height={45} unoptimized />}
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.category} · {item.sku ? "3D demo" : "Your upload"}
                    </small>
                  </div>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => remove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const response = await fetch("/api/admin/session", {
                      method: "DELETE",
                    });
                    if (!response.ok) throw new Error("Sign out failed.");
                    router.refresh();
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "Sign out failed.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Sign out
              </button>
            </section>
          </div>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </main>
    </>
  );
}
