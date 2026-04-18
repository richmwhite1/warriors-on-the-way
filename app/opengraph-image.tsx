import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Warriors on the Way";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1a1610",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Radial bloom */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "30%",
            width: 800,
            height: 600,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(160,120,40,0.18) 0%, rgba(160,120,40,0.04) 50%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          {/* Ornament line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "36px",
            }}
          >
            <div style={{ width: 60, height: 1, background: "#a07828", opacity: 0.5 }} />
            <span
              style={{
                fontSize: 12,
                letterSpacing: "0.4em",
                color: "#a07828",
                textTransform: "uppercase",
              }}
            >
              Another name for lightworkers
            </span>
            <div style={{ width: 60, height: 1, background: "#a07828", opacity: 0.5 }} />
          </div>

          {/* Wordmark */}
          <div
            style={{
              fontSize: 16,
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Warriors on
          </div>
          <div
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: "48px",
            }}
          >
            The Way
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
              maxWidth: 680,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            A gathering of lightbringers committed to reclaiming sovereignty
            and supporting the evolution of consciousness.
          </div>
        </div>
      </div>
    ),
    size
  );
}
