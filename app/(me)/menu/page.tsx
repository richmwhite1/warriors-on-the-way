import Link from "next/link";
import { getNeeds } from "@/lib/queries/needs";
import { AppNav } from "@/components/app-nav";
import { NeedIcon } from "@/components/needs/need-icon";
import { WelcomeOverlay } from "@/components/welcome-overlay";

// The chapter front door — Shannon's warm "menu for local spiritual needs".
// People arrive by felt need (how they show up), not by mission (the why).
export default async function MenuPage() {
  const needs = await getNeeds();

  return (
    <>
      <AppNav />
      <WelcomeOverlay />

      <main className="animate-page-enter" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: "5rem" }}>
        {/* ── Mission frame: Seán's why, wrapping everything ─────────────────── */}
        <section style={{ padding: "1.25rem 1rem 0.5rem" }}>
          <p
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--primary)",
              margin: 0,
            }}
          >
            Salt Lake City &amp; Park City
          </p>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 800,
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--foreground)",
              margin: "6px 0 0",
            }}
          >
            What are you looking for?
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.5, margin: "10px 0 0" }}>
            A free, peer-to-peer network of spiritual community — nobody ever charges. Pick a doorway.{" "}
            <Link href="/sean" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Why this exists →
            </Link>
          </p>
        </section>

        {/* ── The six doorways ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: 12, padding: "1rem" }}>
          {needs.map((need) => (
            <Link
              key={need.id}
              href={`/needs/${need.slug}`}
              className="press-scale animate-fade-up"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "18px 18px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
              >
                <NeedIcon icon={need.icon} size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    lineHeight: 1.2,
                    color: "var(--foreground)",
                    margin: 0,
                  }}
                >
                  {need.name}
                </h2>
                {need.prompt && (
                  <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.45, margin: "6px 0 0" }}>
                    “{need.prompt}”
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
