"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONSCIOUSNESS_SCALE } from "@/lib/consciousness-scale";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConsciousnessSidebar() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Only pull focus back to the trigger for closes the user drove, never on
  // first paint.
  const wasOpen = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

    const first = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? drawerRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      // The toggle doubles as the close control and lives outside the drawer,
      // so it has to be part of the cycle.
      const nodes = [
        ...(toggleRef.current ? [toggleRef.current] : []),
        ...Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
      ];
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === firstNode || !nodes.includes(active as HTMLElement))) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && active === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  return (
    <>
      {/* Toggle pill */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close consciousness map" : "Open consciousness map"}
        aria-expanded={open}
        aria-controls="consciousness-drawer"
        style={{
          position: "fixed",
          bottom: "5.5rem",
          right: "1rem",
          zIndex: 46,
          fontFamily: "var(--font-brand)",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--primary)",
          background: "rgba(26,22,16,0.92)",
          border: "1px solid rgba(160,120,40,0.35)",
          padding: "0.45rem 0.85rem",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          cursor: "pointer",
          lineHeight: 1,
          boxShadow: "0 2px 12px rgba(0,0,0,0.45)",
        }}
      >
        {open ? "✕ Map" : "⊕ Map"}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          aria-hidden="true"
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
        id="consciousness-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Map of Consciousness"
        tabIndex={-1}
        inert={!open}
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
          transition: "transform 0.22s ease, visibility 0.22s ease",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--primary)",
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
                  color: "#f5f0eb",
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
          onClick={close}
          style={{
            display: "inline-block",
            marginTop: "2rem",
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--primary)",
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
