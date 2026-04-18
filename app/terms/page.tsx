import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata = {
  title: "Terms of Use — Warriors on the Way",
};

export default function TermsPage() {
  return (
    <main style={{ background: "#ffffff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1.2rem 3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.96)",
          borderBottom: "1px solid #ede9e1",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#1a1610",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Warriors on the Way
        </Link>
        <Link
          href="/sign-in"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: "#1a1610",
            padding: "0.5rem 1.25rem",
            textDecoration: "none",
          }}
        >
          Sign In
        </Link>
      </nav>

      <div style={{ height: 60 }} />

      {/* Content */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "4rem 2rem 6rem",
          flex: 1,
        }}
      >
        <div style={{ marginBottom: "3rem" }}>
          <SectionLabel>Legal</SectionLabel>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: "#1a1610",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: "0.5rem",
            }}
          >
            Terms of Use
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#c8c2b4",
            }}
          >
            Last updated: April 2026
          </p>
        </div>

        <div
          style={{
            fontFamily: "var(--font-body)",
            color: "#4a4438",
            lineHeight: 1.85,
            fontSize: "1rem",
          }}
        >
          <p style={{ color: "#6b6456", fontStyle: "italic", marginBottom: "2rem" }}>
            These Terms of Use are being finalized. Full terms will be published shortly.
            By using Warriors on the Way, you agree to participate in good faith, treat
            fellow members with respect, and uphold the values expressed in the
            Lightworkers Manifesto.
          </p>

          {[
            {
              heading: "Community Standards",
              body: "Warriors on the Way communities are spaces for sincere engagement with the spiritual and social mission outlined by our Spiritual Director, Fr. Seán Ó'Laoire. Members are expected to engage with honesty, care, and respect for the dignity of all people.",
            },
            {
              heading: "Membership",
              body: "Each local community is capped at 150 members to maintain the depth of relationship that makes genuine transformation possible. Community admins may remove members who violate community standards.",
            },
            {
              heading: "Contact",
              body: "For questions about these terms, contact the Warriors on the Way community through your local community page.",
            },
          ].map(({ heading, body }) => (
            <section key={heading} style={{ marginBottom: "2.5rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-brand)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#1a1610",
                  marginBottom: "0.75rem",
                }}
              >
                {heading}
              </h2>
              <p>{body}</p>
            </section>
          ))}
        </div>

        <Link
          href="/"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c8c2b4",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          ← Back to home
        </Link>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #ede9e1",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            color: "#c8c2b4",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Warriors on the Way
        </span>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: 9,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#c8c2b4",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>

    </main>
  );
}
