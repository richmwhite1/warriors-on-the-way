"use client";

import type React from "react";

// Stub — full implementation in a later phase
export function ImageUpload({
  value,
  onChange,
  bucket,
  label,
}: {
  value?: string | null;
  onChange?: ((url: string) => void) | React.Dispatch<React.SetStateAction<string | null>>;
  bucket?: string;
  label?: string;
  [key: string]: unknown;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
      Image upload coming soon
    </div>
  );
}
