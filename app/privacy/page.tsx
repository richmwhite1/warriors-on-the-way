import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata = {
  title: "Privacy Policy — Warriors on the Way",
};

export default function PrivacyPage() {
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
            Privacy Policy
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
            This Privacy Policy is being finalized. Full policy will be published shortly.
            Warriors on the Way takes the privacy of its members seriously. We collect
            only what we need to operate the platform and connect you with your community.
          </p>

          {[
            {
              heading: "What We Collect",
              body: "We collect your email address (or Google account information) when you sign in, and any profile information you choose to provide — display name, bio, avatar, and timezone. We also store posts, comments, and event RSVPs that you create on the platform.",
            },
            {
              heading: "How We Use It",
              body: "Your information is used solely to operate the Warriors on the Way platform: to authenticate you, show your profile to fellow community members, and deliver notifications about community activity. We do not sell your data or share it with third parties for marketing purposes.",
            },
            {
              heading: "Third-Party Services",
              body: "We use Supabase for authentication and data storage, Cloudinary for image hosting, and optionally Telegram for community group chat. Each of these services has its own privacy policy.",
            },
            {
              heading: "Your Rights",
              body: "You may request deletion of your account and associated data at any time by contacting a community administrator or reaching out through your local community page.",
            },
            {
              heading: "Contact",
              body: "For privacy questions, contact the Warriors on the Way community through your local community page.",
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
