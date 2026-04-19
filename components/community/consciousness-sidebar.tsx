"use client";

import { useState } from "react";
import Link from "next/link";
import { CONSCIOUSNESS_SCALE } from "@/lib/consciousness-scale";

export function ConsciousnessSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle pill */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close consciousness map" : "Open consciousness map"}
        style={{
          position: "fixed",
          bottom: "5.5rem",
          right: "1rem",
          zIndex: 40,
          fontFamily: "var(--font-brand)",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#c4a050",
          background: "rgba(26,22,16,0.92)",
          border: "1px solid rgba(160,120,40,0.35)",
          padding: "0.45rem 0.85rem",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        {open ? "✕ Map" : "⊕ Map"}
      </button>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 44,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(320px, 92vw)",
          zIndex: 45,
          background: "rgba(18,14,10,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          overflowY: "auto",
          padding: "4.5rem 1.25rem 2.5rem",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#a07828",
            marginBottom: "0.5rem",
          }}
        >
          Map of Consciousness
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "1.75rem",
            lineHeight: 1.5,
          }}
        >
          David Hawkins&apos; calibration scale — a reference for spiritual discernment.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {CONSCIOUSNESS_SCALE.map((level) => (
            <div
              key={level.id}
              style={{
                borderLeft: `2px solid ${level.accentHex}`,
                paddingLeft: "0.85rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: level.accentHex,
                  marginBottom: "0.15rem",
                }}
              >
                {level.range}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#f8f7f4",
                  marginBottom: "0.3rem",
                  letterSpacing: "0.05em",
                }}
              >
                {level.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.55,
                }}
              >
                {level.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/consciousness-map"
          onClick={() => setOpen(false)}
          style={{
            display: "inline-block",
            marginTop: "2rem",
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#c4a050",
            textDecoration: "none",
            borderBottom: "1px solid rgba(196,160,80,0.3)",
            paddingBottom: "0.1rem",
          }}
        >
          Explore the Full Map →
        </Link>
      </div>
    </>
  );
}
