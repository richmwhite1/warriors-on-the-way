"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * A card-reveal entrance animation for the guest invitation experience.
 * Inspired by Paperless Post's envelope reveal — a brief moment of delight
 * before showing the full event invitation.
 */
export function InvitationReveal({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Small delay so the animation is visible even on fast connections
    const timer = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={[
        "transition-all duration-700 ease-out",
        revealed
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-[0.97]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
