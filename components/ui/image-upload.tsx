"use client";

import { useRef, useState } from "react";
import type React from "react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

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
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "wotw");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange?.(data.secure_url);
    } catch {
      setError("Upload failed — try again");
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative h-32 w-full rounded-xl overflow-hidden border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange?.("")}
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
        className="w-full rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1.5"
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
            <span className="text-xs opacity-60">JPG, PNG, WEBP · max 10 MB</span>
          </>
        )}
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
