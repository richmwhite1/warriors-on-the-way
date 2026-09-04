"use client";

import { useRef, useState } from "react";
import type React from "react";
import {
  ACCEPT_IMAGES,
  formatMb,
  looksLikeImage,
  prepareImage,
} from "@/lib/image-file";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary's unsigned upload ceiling.
const MAX_BYTES = 10 * 1024 * 1024;

// Longest edge we bother keeping. An event photo is displayed a few hundred
// pixels wide; a 4032px iPhone original is nothing but upload time.
const MAX_EDGE = 2400;

/**
 * Ask Cloudinary to transcode on delivery.
 *
 * A HEIC upload comes back as a .heic URL, which only Safari can render — the
 * image would upload fine and then show as a broken box everywhere else.
 * Dropping the extension and adding f_auto lets Cloudinary serve WebP (or
 * whatever the viewer's browser accepts) from the same original.
 */
function toDeliverableUrl(secureUrl: string): string {
  const marker = "/image/upload/";
  const at = secureUrl.indexOf(marker);
  if (at === -1) return secureUrl;

  const head = secureUrl.slice(0, at + marker.length);
  const tail = secureUrl.slice(at + marker.length).replace(/\.[a-z0-9]+$/i, "");
  return `${head}f_auto,q_auto/${tail}`;
}

type Props = {
  value?: string | null;
  onChange?: ((url: string) => void) | React.Dispatch<React.SetStateAction<string | null>>;
  label?: string;
  bucket?: string;
  [key: string]: unknown;
};

export function ImageUpload({ value, onChange, label = "Upload image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  async function upload(file: File) {
    if (!configured) {
      setError("Image uploads aren't configured yet — tell Rich.");
      return;
    }
    if (!looksLikeImage(file)) {
      setError("That file isn't an image. Pick a photo instead.");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      // Oversized photos get re-encoded rather than rejected.
      const toSend = await prepareImage(file, { maxBytes: MAX_BYTES, maxEdge: MAX_EDGE });
      if (toSend.size > MAX_BYTES) {
        throw new Error(
          `That image is ${formatMb(toSend.size)} and the limit is 10 MB — try a smaller one.`
        );
      }

      const fd = new FormData();
      fd.append("file", toSend);
      fd.append("upload_preset", UPLOAD_PRESET!);
      fd.append("folder", "wotw");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.secure_url) {
        // Cloudinary explains exactly what it rejected — say so rather than
        // leaving the host guessing why nothing happened.
        throw new Error(data?.error?.message || `Upload failed (${res.status})`);
      }

      onChange?.(toDeliverableUrl(data.secure_url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — try again");
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative h-32 w-full rounded-xl overflow-hidden border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setError("That image can't be displayed. Try uploading it again.")}
          />
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange?.("");
            }}
            className="absolute top-2 right-2 size-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone / button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full rounded-lg border border-dashed px-4 py-5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1.5 ${
          dragging
            ? "border-primary text-foreground bg-primary/5"
            : "text-muted-foreground hover:border-primary hover:text-foreground"
        }`}
      >
        {uploading ? (
          <>
            <span className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>{value ? "Replace image" : label}</span>
            <span className="text-xs opacity-60">Any photo — iPhone HEIC, JPG, PNG, WEBP, GIF · max 10 MB</span>
          </>
        )}
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGES}
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
