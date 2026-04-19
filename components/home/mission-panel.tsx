"use client";

import { useState } from "react";
import Link from "next/link";

const MISSION_POINTS = [
  "Take education away from the child molesters",
  "Take economics away from the banksters",
  "Take healing away from Big Pharma",
  "Take storytelling away from the mass media",
  "Take entertainment away from Hollywood",
  "Take food production away from agribusiness",
  "Take fire away from the military-industrial complex",
  "Take democracy away from the politicians",
  "Take spirituality away from Mecca and from Rome",
];

const SHIFTS = [
  { domain: "Education",     from: "Indoctrination",                              to: "Exploration" },
  { domain: "Entertainment", from: "Sensual arousal",                             to: "Mystical stimulation" },
  { domain: "Economics",     from: "Dominion by the elite",                       to: "Distribution to all" },
  { domain: "Religion",      from: "Dogmatic sectarianism",                       to: "Unity identity" },
  { domain: "Politics",      from: "Party-affiliated blindness",                  to: "Issue-identified solutions" },
  { domain: "Agriculture",   from: "Gaia-destructive profiteering",               to: "Gaia-enhancing gratitude" },
  { domain: "Medicine",      from: "Pharmaceutically controlled disease management", to: "People-centered, hands-on healthcare" },
];

function AccordionRow({
  label,
  open,
  onToggle,
  children,
  last,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid #ede9e1" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#1a1610",
            fontSize: "1rem",
          }}
        >
          {label}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 16,
            height: 16,
            color: "#c8c2b4",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            background: "#f8f7f4",
            padding: "1rem 1rem 1.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MissionPanel() {
  const [missionOpen, setMissionOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  return (
    <section>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <a
          href="https://www.spiritsinspacesuits.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ flexShrink: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sean-olaoire.webp"
            alt="Seán Ó'Laoire"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "top",
              opacity: 0.9,
              outline: "1px solid rgba(160,120,40,0.3)",
            }}
          />
        </a>
        <p
          style={{
            fontFamily: "var(--font-body)",
            flex: 1,
            fontSize: 14,
            color: "#c8c2b4",
          }}
        >
          Seán Ó&apos;Laoire · Lightworkers Manifesto
        </p>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 12,
            color: "#a07828",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Full text →
        </Link>
      </div>

      {/* Accordion */}
      <div style={{ borderTop: "1px solid #ede9e1" }}>

        {/* The Mission */}
        <AccordionRow label="The Mission" open={missionOpen} onToggle={() => setMissionOpen(v => !v)}>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {MISSION_POINTS.map((point) => (
              <li
                key={point}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.75rem",
                  padding: "0.4rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  color: "#2e2820",
                }}
              >
                <span style={{ color: "#a07828", fontSize: "0.5rem", flexShrink: 0 }}>✦</span>
                {point}
              </li>
            ))}
          </ul>
        </AccordionRow>

        {/* The Why */}
        <AccordionRow label="The Why" open={whyOpen} onToggle={() => setWhyOpen(v => !v)}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              color: "#6b6456",
              lineHeight: 1.7,
              marginBottom: "1rem",
            }}
          >
            As a human species, we need a transformation of both our consciousness and our mission.
            As we move from <em style={{ color: "#2e2820" }}>Homo sapiens sapiens</em> to{" "}
            <em style={{ color: "#2e2820", fontWeight: 500 }}>Homo spiritualis</em>, we must:
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {SHIFTS.map(({ domain, from, to }) => (
              <li
                key={domain}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.75rem",
                  padding: "0.4rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.7)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#a07828",
                    width: 100,
                    flexShrink: 0,
                  }}
                >
                  {domain}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#6b6456" }}>
                  <span style={{ textDecoration: "line-through", opacity: 0.5 }}>{from}</span>
                  <span style={{ margin: "0 0.4rem" }}>→</span>
                  <span style={{ fontWeight: 500, color: "#2e2820" }}>{to}</span>
                </span>
              </li>
            ))}
          </ul>
        </AccordionRow>

        {/* The How */}
        <AccordionRow label="The How" open={howOpen} onToggle={() => setHowOpen(v => !v)} last>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              color: "#6b6456",
              lineHeight: 1.7,
            }}
          >
            Communities challenge and support one another to raise collective consciousness.
            Create a community · invite members to gatherings · post discussions · share music &amp; video.
          </p>
        </AccordionRow>

      </div>
    </section>
  );
}
