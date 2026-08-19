"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wow_welcome_seen_v1";

type Step = { eyebrow: string; title: string; body: string };

const STEPS: Step[] = [
  {
    eyebrow: "Welcome",
    title: "Warriors on the Way",
    body: "A place to find your people — offline. Small local communities (capped at 150) and real, in-person gatherings, organized around nine things worth building a life around.",
  },
  {
    eyebrow: "The Nine & your Deck",
    title: "Follow what calls you",
    body: "The Nine are the domains we focus on. Follow the ones that matter to you and your Deck fills with what's happening in them — discussions, gatherings, and communities to join.",
  },
  {
    eyebrow: "Find your people",
    title: "Join, or start something",
    body: "Browse Communities to join one near you — or start your own and invite friends. A new community goes live once it reaches five members. Then you gather, for real.",
  },
];

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode) — just don't show it
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Warriors on the Way"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        background: "rgba(26,22,16,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "linear-gradient(160deg, #fdf9f0 0%, #f8f4ec 100%)",
          border: "1px solid #e8dcc8",
          borderRadius: 20,
          padding: "1.75rem 1.5rem 1.5rem",
          boxShadow: "0 24px 60px rgba(26,22,16,0.28)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--primary)",
            margin: 0,
          }}
        >
          {s.eyebrow}
        </p>
        <h2
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
            margin: "0.4rem 0 0.6rem",
            lineHeight: 1.15,
          }}
        >
          {s.title}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.55,
            color: "#4a4438",
            margin: 0,
            minHeight: 92,
          }}
        >
          {s.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "1.25rem 0" }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                borderRadius: 9999,
                background: i === step ? "var(--primary)" : "#d8ccb8",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={dismiss}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted-foreground)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: "10px 4px",
            }}
          >
            Skip
          </button>
          <button
            onClick={() => (isLast ? dismiss() : setStep((v) => v + 1))}
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-brand)",
              fontWeight: 700,
              fontSize: 15,
              color: "#ffffff",
              background: "var(--primary)",
              border: 0,
              borderRadius: 9999,
              padding: "11px 26px",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
