// Renders a resolved link_preview: an in-app streaming embed for embeddable
// providers, otherwise a generic link-preview card. Provider-agnostic.
//
// Embeds load their player automatically — no click-to-reveal. Video
// (YouTube/Rumble/Vimeo) shows the provider's poster frame with a play button
// so the viewer sees an image (not a link) and taps once to stream in-app.
// Audio (Spotify/SoundCloud/podcast) loads its native player inline.

type LinkPreview = {
  provider: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  url: string;
};

const AUDIO_PROVIDERS = new Set(["spotify", "soundcloud", "podcast"]);

export function EmbedRender({ preview }: { preview: LinkPreview | null }) {
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

    // Video — load the player frame directly. YouTube/Rumble/Vimeo render their
    // own poster image + play button, so the viewer immediately sees an image
    // and streams in one tap without leaving the app.
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
          src={preview.embedUrl}
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
