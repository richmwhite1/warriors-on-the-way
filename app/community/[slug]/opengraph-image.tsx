import { ImageResponse } from "next/og";
import { getCommunityBySlugPublic } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";
import { fetchOgBackground } from "@/lib/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Warriors on the Way Community";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlugPublic(slug).catch(() => null);
  const memberCount = community
    ? await getActiveMemberCount(community.id).catch(() => 0)
    : 0;

  // Fetch the banner as a data URI so Satori can render it — only if it's a
  // supported format (JPEG/PNG); WebP/AVIF would crash the renderer.
  const bgSrc = community?.banner_url ? await fetchOgBackground(community.banner_url) : null;

  const name = community?.name ?? "Warriors on the Way";
  const blurb =
    community?.description?.trim() || community?.mission?.trim() || "";
  const cap = community?.member_cap ?? 150;

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
        {/* Background banner */}
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
              opacity: 0.4,
            }}
          />
        )}

        {/* Gradient overlay — keeps text legible over any banner */}
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
          {/* Top badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(224,112,64,0.15)",
              border: "1px solid rgba(224,112,64,0.3)",
              borderRadius: "999px",
              padding: "8px 20px",
              marginBottom: "20px",
              alignSelf: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 16,
                letterSpacing: "0.15em",
                color: "#6e8b6a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              You&apos;re Invited to Join
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: name.length > 34 ? 56 : 72,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "0.01em",
              marginBottom: blurb ? "20px" : "24px",
            }}
          >
            {name}
          </div>

          {/* Blurb */}
          {blurb && (
            <div
              style={{
                fontSize: 26,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.35,
                marginBottom: "24px",
                display: "flex",
              }}
            >
              {blurb.length > 120 ? `${blurb.slice(0, 120)}…` : blurb}
            </div>
          )}

          {/* Member count pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "8px 18px",
              }}
            >
              <div style={{ display: "flex" }}>
                {Array.from({ length: Math.min(Math.max(memberCount, 1), 4) }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#6e8b6a",
                      border: "2px solid rgba(26,22,16,0.8)",
                      marginLeft: i > 0 ? -6 : 0,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                {memberCount} of {cap} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
