"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
}

// Axis 1 of the deck: swipe left/right anywhere on the feed to move between the
// nine objectives. Horizontal-dominant gestures navigate (?mode=); vertical drags
// fall through to normal scrolling. "Swipe then load" — reuses the server feed path.
export function DeckShell({
  slugs, activeSlug, children,
}: {
  slugs: string[];
  activeSlug: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);

  const index = slugs.indexOf(activeSlug);
  const THRESHOLD = 64;

  function go(dir: 1 | -1) {
    const next = index + dir;
    if (next < 0 || next >= slugs.length) return;
    vibrate();
    router.push(`/deck?mode=${slugs[next]}`, { scroll: false });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return; // pointer-drag reserved for touch
    start.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    // Only track once the gesture is clearly horizontal.
    if (Math.abs(dx) > Math.abs(dy)) setDragX(Math.max(-80, Math.min(80, dx)));
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    setDragX(0);
    if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { start.current = null; setDragX(0); }}
      style={{
        transform: dragX ? `translateX(${dragX * 0.4}px)` : undefined,
        transition: dragX ? "none" : "transform 0.2s cubic-bezier(0.2,0,0,1)",
        touchAction: "pan-y",
      }}
    >
      {children}
    </div>
  );
}
