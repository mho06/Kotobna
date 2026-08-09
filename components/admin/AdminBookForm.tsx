"use client";

import { useState } from "react";
import ImageCropper from "./ImageCropper";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { useCategories } from "@/lib/useCategories";

const FIELD_KEYS = ["title", "author", "genre", "publish_date", "description", "condition"];

export default function AdminBookForm(props: { password: string; onSaved: () => void }) {
  const password = props.password;
  const onSaved = props.onSaved;

  const [fields, setFields] = useState<Record<string, string>>({});
  const [price, setPrice] = useState("");
  const [frontRaw, setFrontRaw] = useState<string | null>(null);
  const [frontCropped, setFrontCropped] = useState<string | null>(null);
  const [backRaw, setBackRaw] = useState<string | null>(null);
  const [backCropped, setBackCropped] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const categoriesResult = useCategories();
  const categories = categoriesResult.categories;

  function setField(key: string, value: string) {
    setFields(function (prev) {
      const next = Object.assign({}, prev);
      next[key] = value;
      return next;
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result as string;
      if (side === "front") setFrontRaw(dataUrl);
      else setBackRaw(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleAutoFill() {
    if (!frontCropped && !frontRaw) return;
    setExtracting(true);
    setError("");
    try {
      const imageDataUrl = frontCropped || frontRaw || "";
      const parts = imageDataUrl.split(",");
      const meta = parts[0];
      const base64 = parts[1];
      const mediaTypeMatch = meta.match(/data:(.*);base64/);
      const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : "image/jpeg";

      const res = await fetch("/api/admin/extract-details", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ image: base64, mediaType: mediaType, fieldKeys: FIELD_KEYS }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFields(function (prev) { return Object.assign({}, prev, data); });
    } catch (err) {
      setError("Auto-fill failed - you can still fill in details manually.");
      console.error(err);
    } finally {
      setExtracting(false);
    }
  }

  async function uploadToImageKit(dataUrl: string, fileName: string) {
    const authRes = await fetch("/api/admin/imagekit-auth", {
      headers: { "x-admin-password": password },
    });
    if (!authRes.ok) {
      throw new Error("Could not authenticate with ImageKit. Check your connection and try again.");
    }
    const auth = await authRes.json();

    const form = new FormData();
    form.append("file", dataUrl);
    form.append("fileName", fileName);
    form.append("folder", "/kotobna");
    form.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string);
    form.append("signature", auth.signature);
    form.append("expire", auth.expire);
    form.append("token", auth.token);

    const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: form,
    });
    const uploaded = await uploadRes.json();

    if (!uploadRes.ok || !uploaded.url) {
      const reason = uploaded.message || "Unknown error";
      throw new Error("Image upload failed: " + reason + ". Try a smaller photo or check your connection.");
    }
    return uploaded.url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const frontImage = frontCropped || frontRaw;
      if (!frontImage) throw new Error("A front cover photo is required.");

      const frontUrl = await uploadToImageKit(frontImage, "book-" + Date.now() + "-front.jpg");
      const backImage = backCropped || backRaw;
      let backUrl: string | null = null;
      if (backImage) {
        backUrl = await uploadToImageKit(backImage, "book-" + Date.now() + "-back.jpg");
      }

      const item = Object.assign({}, fields, {
        price: price,
        front_image_url: frontUrl,
        back_image_url: backUrl,
      });

      const res = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ item: item }),
      });

      if (!res.ok) throw new Error(await res.text());

      setToastMessage((fields.title || "Book") + " saved");
      setTimeout(function () { setToastMessage(""); }, 2500);

      setFields({});
      setPrice("");
      setFrontRaw(null);
      setFrontCropped(null);
      setBackRaw(null);
      setBackCropped(null);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save book.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-card border border-ink/10 rounded-card p-6 mb-10">
      <h2 className="font-display text-xl font-semibold mb-4">Add Book</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest text-ink/60 mb-2">
            Front cover
          </label>
          {!frontRaw && (
            <input type="file" accept="image/*" onChange={function (e) { handleFileSelect(e, "front"); }} />
          )}
          {frontRaw && !frontCropped && (
            <ImageCropper
              imageSrc={frontRaw}
              onConfirm={setFrontCropped}
              onSkip={function () { setFrontCropped(frontRaw); }}
            />
          )}
          {frontCropped && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frontCropped} alt="Front preview" className="max-h-48 rounded-card border border-ink/15 mb-2" />
              <div className="flex gap-2">
                <button type="button" onClick={function () { setFrontCropped(null); }} className="font-mono text-[10px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-3 py-1.5 hover:border-ink transition-colors">
                  Re-crop
                </button>
                <button type="button" onClick={function () { setFrontRaw(null); setFrontCropped(null); }} className="font-mono text-[10px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-3 py-1.5 hover:border-ink transition-colors">
                  Replace photo
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest text-ink/60 mb-2">
            Back cover (optional)
          </label>
          {!backRaw && (
            <input type="file" accept="image/*" onChange={function (e) { handleFileSelect(e, "back"); }} />
          )}
          {backRaw && !backCropped && (
            <ImageCropper
              imageSrc={backRaw}
              onConfirm={setBackCropped}
              onSkip={function () { setBackCropped(backRaw); }}
            />
          )}
          {backCropped && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backCropped} alt="Back preview" className="max-h-48 rounded-card border border-ink/15 mb-2" />
              <div className="flex gap-2">
                <button type="button" onClick={function () { setBackCropped(null); }} className="font-mono text-[10px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-3 py-1.5 hover:border-ink transition-colors">
                  Re-crop
                </button>
                <button type="button" onClick={function () { setBackRaw(null); setBackCropped(null); }} className="font-mono text-[10px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-3 py-1.5 hover:border-ink transition-colors">
                  Replace photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(frontCropped || frontRaw) && (
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={extracting}
          className="mb-6 font-mono text-[11px] uppercase tracking-widest border border-ochre text-ochre rounded-full px-4 py-2 hover:bg-ochre hover:text-cream transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {extracting && <Spinner />}
          {extracting ? "Reading photo..." : "Auto-fill from photo"}
        </button>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {FIELD_KEYS.map(function (key) {
          const isDescription = key === "description";
          const isGenre = key === "genre";
          return (
            <div key={key} className={isDescription ? "sm:col-span-2" : ""}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-1">
                {key.replace("_", " ")}
              </label>
              {isDescription && (
                <textarea
                  value={fields[key] || ""}
                  onChange={function (e) { setField(key, e.target.value); }}
                  rows={3}
                  className="w-full bg-cream border border-ink/15 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-forest"
                />
              )}
              {!isDescription && isGenre && (
                <select
                  value={fields[key] || ""}
                  onChange={function (e) { setField(key, e.target.value); }}
                  className="w-full bg-cream border border-ink/15 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-forest"
                >
                  <option value="">Select...</option>
                  {categories.map(function (c) {
                    return <option key={c.id} value={c.value}>{c.value}</option>;
                  })}
                </select>
              )}
              {!isDescription && !isGenre && (
                <input
                  type="text"
                  value={fields[key] || ""}
                  onChange={function (e) { setField(key, e.target.value); }}
                  className="w-full bg-cream border border-ink/15 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-forest"
                />
              )}
            </div>
          );
        })}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-1">
            price
          </label>
          <input
            type="text"
            value={price}
            onChange={function (e) { setPrice(e.target.value); }}
            placeholder="e.g. $12"
            className="w-full bg-cream border border-ink/15 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="font-mono text-[11px] uppercase tracking-widest bg-forest text-cream rounded-full px-5 py-2.5 hover:bg-forest-dark transition-colors disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving && <Spinner />}
        {saving ? "Saving..." : "Save book"}
      </button>
    </form>
    <Toast message={toastMessage} show={!!toastMessage} />
    </>
  );
}
