"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

// The emotional payload of the project. On first contact with a topic the objective
// shows expanded, full-weight (verbatim manifesto + solution). After that it
// collapses to an icon control that reopens it as a sheet.
export function ObjectiveSheet({
  name,
  manifesto,
  solution,
  firstVisit,
}: {
  name: string;
  manifesto: string;
  solution: string | null;
  firstVisit: boolean;
}) {
  const [open, setOpen] = useState(firstVisit);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 26, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
          {name}
        </h1>
        <button
          onClick={() => setOpen(true)}
          aria-label="Show the objective"
          style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 999, border: "1px solid #e8e2da",
            background: "#faf8f5", color: "#6e8b6a", cursor: "pointer",
          }}
        >
          <Info size={18} strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end",
            justifyContent: "center", background: "rgba(26,22,16,0.45)", backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 640, background: "#ffffff",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "24px 22px calc(28px + env(safe-area-inset-bottom))",
              boxShadow: "0 -12px 40px rgba(26,26,26,0.18)",
              animation: "objsheet-up .28s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <style>{`@keyframes objsheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7c7589" }}>
                The Objective
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ border: 0, background: "transparent", color: "#7c7589", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Verbatim manifesto — Seán's words, never softened. */}
            <p style={{ fontFamily: "var(--font-brand)", fontSize: 22, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3, margin: 0 }}>
              {manifesto}
            </p>

            {/* Solution framing — what gets built in its place. */}
            {solution && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "#4a4a45", lineHeight: 1.5, marginTop: 16 }}>
                {solution}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
