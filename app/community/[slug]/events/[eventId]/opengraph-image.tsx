import { ImageResponse } from "next/og";
import { getEventWithDetails } from "@/lib/queries/events";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Warriors on the Way Event";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventWithDetails(eventId).catch(() => null);

  // Try to fetch the event image as a data URI so Satori can render it
  let bgSrc: string | null = null;
  if (event?.image_url) {
    try {
      const res = await fetch(event.image_url);
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        const buf = await res.arrayBuffer();
        bgSrc = `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
      }
    } catch {
      // fall back to branded card
    }
  }

  const title = event?.title ?? "Warriors on the Way";
  const formattedDate = event?.starts_at
    ? new Date(event.starts_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#1a1610",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background image */}
        {bgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgSrc}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        {/* Gradient overlay — stronger at bottom so text is always legible */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: bgSrc
              ? "linear-gradient(to top, rgba(26,22,16,1) 0%, rgba(26,22,16,0.55) 55%, rgba(26,22,16,0.3) 100%)"
              : "linear-gradient(135deg, #1a1610 0%, #2d2618 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                background: "#a07828",
                opacity: 0.7,
              }}
            />
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.3em",
                color: "#a07828",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Warriors on the Way
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 52 : 68,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              marginBottom: formattedDate ? "20px" : "0",
            }}
          >
            {title}
          </div>

          {/* Date */}
          {formattedDate && (
            <div
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.04em",
              }}
            >
              {formattedDate}
              {event?.location ? ` · ${event.location}` : ""}
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
