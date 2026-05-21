"use client";

import { useState, useEffect } from "react";

const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
const JOINED_MS  = 365 * 24 * 60 * 60 * 1000; // 1 year

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

  useEffect(() => {
    if (isDismissed(communityId)) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [communityId]);

  if (!visible) return null;

  function handleDismiss() {
    dismiss(communityId, DISMISS_MS);
    setVisible(false);
  }

  function handleJoin() {
    dismiss(communityId, JOINED_MS);
    setVisible(false);
  }

  return (
    <div className="fixed top-[3.75rem] inset-x-0 z-40 px-3 animate-in slide-in-from-top-2 duration-300">
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
