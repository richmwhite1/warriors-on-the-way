import { ImageResponse } from "next/og";
import { getEventForGuest } from "@/lib/queries/events";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Warriors on the Way Event";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventForGuest(eventId).catch(() => null);

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

  const going = event?.rsvp_counts?.yes ?? 0;
  const maybe = event?.rsvp_counts?.maybe ?? 0;

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
          {/* Top badge — "You're Invited" */}
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
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(224,112,64,0.15)",
                border: "1px solid rgba(224,112,64,0.3)",
                borderRadius: "999px",
                padding: "8px 20px",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  letterSpacing: "0.15em",
                  color: "#e07040",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                You&apos;re Invited
              </span>
            </div>
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
              marginBottom: "24px",
            }}
          >
            {title}
          </div>

          {/* Date + location + attendees in a single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {formattedDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: 22,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.02em",
                }}
              >
                <span>{formattedDate}</span>
                {event?.location && (
                  <span style={{ color: "rgba(255,255,255,0.35)" }}> · </span>
                )}
                {event?.location && <span>{event.location}</span>}
              </div>
            )}

            {going > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "999px",
                  padding: "6px 16px",
                }}
              >
                {/* Attendee dots */}
                <div style={{ display: "flex" }}>
                  {Array.from({ length: Math.min(going, 4) }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#e07040",
                        border: "2px solid rgba(26,22,16,0.8)",
                        marginLeft: i > 0 ? -6 : 0,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 600,
                  }}
                >
                  {going} going{maybe > 0 ? ` · ${maybe} maybe` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size
  );
}
