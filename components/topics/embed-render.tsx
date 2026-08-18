"use client";

// Renders a resolved link_preview: an in-app streaming embed for embeddable
// providers, otherwise a generic link-preview card. Provider-agnostic.
//
// Video (YouTube/Rumble/Vimeo) renders as a click-to-play "streaming thumbnail":
// the poster shows immediately, and tapping it swaps in the autoplay iframe so
// the viewer streams without leaving the app. Audio (Spotify/SoundCloud/podcast)
// loads its native player inline. Everything stays on the app.

import { useState } from "react";

type LinkPreview = {
  provider: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  url: string;
};

const AUDIO_PROVIDERS = new Set(["spotify", "soundcloud", "podcast"]);

function withAutoplay(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}autoplay=1`;
}

export function EmbedRender({ preview }: { preview: LinkPreview | null }) {
  const [playing, setPlaying] = useState(false);

  if (!preview) return null;

  if (preview.embedUrl) {
    const isAudio = AUDIO_PROVIDERS.has(preview.provider);

    // Audio players load inline (they already show their own artwork + controls).
    if (isAudio) {
      return (
        <div
          style={{
            marginTop: 10,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border)",
            height: preview.provider === "spotify" ? 152 : 166,
          }}
        >
          <iframe
            src={preview.embedUrl}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>
      );
    }

    // Video — show a streaming thumbnail until tapped, then autoplay in-app.
    if (preview.thumbnailUrl && !playing) {
      return (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={preview.title ? `Play ${preview.title}` : "Play video"}
          style={{
            position: "relative",
            display: "block",
            width: "100%",
            marginTop: 10,
            padding: 0,
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            cursor: "pointer",
            background: "#000",
            aspectRatio: "16 / 9",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.thumbnailUrl}
            alt={preview.title ?? ""}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: 9999,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" style={{ fill: "#fff", marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          {preview.title && (
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: 12,
                textAlign: "left",
                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                color: "#fff",
                fontFamily: "var(--font-brand)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {preview.title}
            </span>
          )}
        </button>
      );
    }

    // Video without a thumbnail, or after the poster was tapped: embed directly.
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
        }}
      >
        <iframe
          src={playing ? withAutoplay(preview.embedUrl) : preview.embedUrl}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  // Generic link-preview card.
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        marginTop: 10,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "var(--foreground)",
      }}
    >
      {preview.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.thumbnailUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
      )}
      <div style={{ padding: 12 }}>
        <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14 }}>
          {preview.title ?? preview.url}
        </div>
        {preview.description && (
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted-foreground)", marginTop: 4, lineHeight: 1.4 }}>
            {preview.description.slice(0, 160)}
          </div>
        )}
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#a39",  marginTop: 6, opacity: 0.7 }}>
          {(() => { try { return new URL(preview.url).hostname.replace(/^www\./, ""); } catch { return preview.url; } })()}
        </div>
      </div>
    </a>
  );
}
