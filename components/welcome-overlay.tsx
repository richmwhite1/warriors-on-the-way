"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "wow_welcome_seen_v1";

// Front doors only. The explainer used to live on /menu alone, so anyone arriving by a
// shared link — the most common way a stranger gets here — never met it. But it must not
// open over a page someone was *sent* to: a shared circle or event link is a specific
// promise, and a modal in front of it is a toll gate. So it greets on the browse
// surfaces and stays out of the way on anything deep-linked.
const FRONT_DOORS = new Set(["/menu", "/community", "/events"]);

type Step = { eyebrow: string; title: string; body: string };

// Plain words carry the meaning; the words this community actually uses are introduced
// right beside them. Someone who bounces after step one should still know what the app
// is, and someone who reads all four should never meet "doorway", "circle" or "The Nine"
// later without having been told what it means.
const STEPS: Step[] = [
  {
    eyebrow: "Welcome",
    title: "Warriors on the Way",
    body: "A free network of small spiritual communities around Salt Lake City and Park City. You find a group near you, then you meet them in person. Nobody ever charges to gather — there's nothing to buy here.",
  },
  {
    eyebrow: "How it works",
    title: "Start with what you need",
    body: "Home asks what you're looking for. Each answer is a doorway — a way in. Behind it are circles: small groups that meet regularly, close to you.",
  },
  {
    eyebrow: "Step two",
    title: "Show up in person",
    body: "Circles post real gatherings at real addresses — a walk, a sit, a potluck, a class. You'll see what's coming up and can say you're in. Everyone here uses their real name, and everyone is 18 or older.",
  },
  {
    eyebrow: "The Nine",
    title: "The why underneath",
    body: "Nine objectives, in Se\u00e1n's words — education, economics, healing, storytelling, entertainment, food, fire, democracy, spirituality. Every gathering wears one as a badge. It's the meaning behind the meeting; you never need it to join.",
  },
  {
    eyebrow: "Find your people",
    title: "Join, or start something",
    body: "Browse Communities to join one near you — or start your own and invite friends. A new circle opens to everyone once five people join. Then you gather, for real.",
  },
];

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!FRONT_DOORS.has(pathname)) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode) — just don't show it
    }
  }, [pathname]);

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
            // Holds the tallest step so the dots and buttons don't jump between them.
            minHeight: 116,
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
