"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  title: string;
  text: string;
  url: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
};

export function ShareButton({ title, text, url, size = "sm", variant = "outline" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Ensure absolute URL so it works when shared outside the app
    const absoluteUrl = url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: absoluteUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleShare} className="gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
