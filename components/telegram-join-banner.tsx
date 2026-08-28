"use client";

import { useState, useEffect } from "react";

const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days — an explicit "no"
const JOINED_MS  = 365 * 24 * 60 * 60 * 1000; // 1 year — they joined
const IGNORED_MS = 24 * 60 * 60 * 1000;       // 1 day — it timed out on its own

// It used to hold its slot under the header at every scroll position until
// someone dismissed it, costing roughly a tenth of a phone screen the whole
// time. It now behaves like a toast: it announces itself, then retires.
const VISIBLE_MS = 12000;

function storageKey(communityId: string) {
  return `tg_banner_${communityId}`;
}

function isDismissed(communityId: string): boolean {
  try {
    const raw = localStorage.getItem(storageKey(communityId));
    if (!raw) return false;
    const { until } = JSON.parse(raw) as { until: number };
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismiss(communityId: string, duration: number) {
  localStorage.setItem(storageKey(communityId), JSON.stringify({ until: Date.now() + duration }));
}

export function TelegramJoinBanner({
  telegramUrl,
  communityName,
  communityId,
}: {
  telegramUrl: string;
  communityName: string;
  communityId: string;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isDismissed(communityId)) return;
    const show = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(show);
  }, [communityId]);

  useEffect(() => {
    if (!visible) return;
    const retire = setTimeout(() => {
      // Timing out is not a "no" — ask again tomorrow, not in a month.
      try {
        dismiss(communityId, IGNORED_MS);
      } catch {
        // localStorage unavailable — hiding it is still the right move.
      }
      setLeaving(true);
      setTimeout(() => setVisible(false), 300);
    }, VISIBLE_MS);
    return () => clearTimeout(retire);
  }, [visible, communityId]);

  if (!visible) return null;

  function handleDismiss() {
    try {
      dismiss(communityId, DISMISS_MS);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  function handleJoin() {
    try {
      dismiss(communityId, JOINED_MS);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <div
      role="status"
      className={`fixed top-[3.75rem] inset-x-0 z-40 px-3 transition-all duration-300 ${
        leaving ? "-translate-y-2 opacity-0" : "animate-in slide-in-from-top-2"
      }`}
    >
      <div className="max-w-2xl mx-auto rounded-2xl border bg-background shadow-lg p-3.5 flex items-center gap-3">
        <div className="shrink-0 size-9 rounded-full bg-[#229ED9] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">Join us on Telegram</p>
          <p className="text-xs text-muted-foreground truncate">{communityName} · stay connected between gatherings</p>
        </div>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleJoin}
          className="shrink-0 rounded-full bg-[#229ED9] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          Join
        </a>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
