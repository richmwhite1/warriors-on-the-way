"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  eventTitle: string;
  /** ID of the inline RSVP form to scroll to */
  targetId: string;
};

/**
 * A sticky bottom bar that appears when the inline RSVP form scrolls out of view.
 * Tapping it smoothly scrolls back to the form.
 */
export function StickyRsvpBar({ eventTitle, targetId }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border/50 px-4 py-3 safe-bottom animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{eventTitle}</p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className="shrink-0 px-6"
        >
          RSVP
        </Button>
      </div>
    </div>
  );
}
