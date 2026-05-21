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
          borderBottom: "1px solid #e8e2da",
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
            color: "#1a1a2e",
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
            background: "#1a1a2e",
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
              color: "#1a1a2e",
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
              color: "#7c7589",
            }}
          >
            Last updated: May 2026
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
          {[
            {
              heading: "Acceptance of Terms",
              body: "By accessing or using the Warriors on the Way platform, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform. We may update these terms from time to time, and continued use constitutes acceptance of any changes.",
            },
            {
              heading: "Community Standards",
              body: "Warriors on the Way communities are spaces for sincere engagement with the spiritual and social mission outlined by our Spiritual Director, Fr. Seán Ó'Laoire. Members are expected to engage with honesty, care, and respect for the dignity of all people. Harassment, hate speech, spam, and intentionally disruptive behaviour are not tolerated.",
            },
            {
              heading: "Membership",
              body: "Each local community is capped at 150 members to maintain the depth of relationship that makes genuine transformation possible. Community admins may remove members who violate community standards. Membership may be revoked at any time for conduct that undermines the safety or integrity of the community.",
            },
            {
              heading: "User Content",
              body: "You retain ownership of the content you post. By posting, you grant Warriors on the Way a non-exclusive licence to display your content within the platform. You are responsible for ensuring your content does not infringe on any third-party rights.",
            },
            {
              heading: "Prohibited Conduct",
              body: "You agree not to: impersonate others; distribute malware or harmful code; scrape or collect data from the platform without authorisation; use the platform for commercial solicitation; or attempt to circumvent any security measures.",
            },
            {
              heading: "Limitation of Liability",
              body: "Warriors on the Way is provided on an \"as is\" basis. We make no warranties regarding availability, accuracy, or fitness for a particular purpose. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
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
                  color: "#1a1a2e",
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
            color: "#7c7589",
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
          borderTop: "1px solid #e8e2da",
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
            color: "#7c7589",
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
                color: "#7c7589",
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
