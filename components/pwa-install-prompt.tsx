"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISSED_KEY = "pwa_prompt_dismissed";

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    const p = detectPlatform();
    if (p === "other") return;
    setPlatform(p);
    // Small delay so it doesn't fire instantly on page load
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setModalOpen(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-16 inset-x-0 z-50 px-3 sm:hidden">
        <div className="rounded-2xl border bg-background shadow-lg p-4 flex items-center gap-3">
          <div className="shrink-0 size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">Get push notifications</p>
            <p className="text-xs text-muted-foreground">Add WoW to your home screen</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5"
          >
            How
          </button>
          <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-background shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <h2 className="font-heading font-semibold text-base">Add to Home Screen</h2>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Adding WoW to your home screen lets you receive <strong>push notifications</strong> for new events and messages — just like a native app.
              </p>
            </div>

            {platform === "ios" ? <IosSteps /> : <AndroidSteps />}

            <div className="px-5 pb-5">
              <button
                onClick={dismiss}
                className="w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-3"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IosSteps() {
  const steps = [
    {
      num: 1,
      label: 'Tap the Share button at the bottom of Safari',
      img: "/ios-safari-share.png",
      imgAlt: "Safari share button highlighted in toolbar",
    },
    {
      num: 2,
      label: 'Scroll down and tap "Add to Home Screen"',
      img: "/ios-install-step1.png",
      imgAlt: "Share sheet with Add to Home Screen highlighted",
    },
    {
      num: 3,
      label: 'Tap "Add" in the top-right corner',
      img: "/ios-add-confirm.png",
      imgAlt: "Add to Home Screen confirmation screen",
    },
  ];

  return (
    <div className="px-5 space-y-5 pb-4">
      {steps.map((s) => (
        <div key={s.num} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
              {s.num}
            </span>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
          <div className="rounded-xl overflow-hidden border bg-muted">
            <img
              src={s.img}
              alt={s.imgAlt}
              className="w-full object-contain max-h-52"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="px-5 space-y-4 pb-4">
      {[
        'Tap the three-dot menu (⋮) in the top-right corner of Chrome',
        'Tap "Add to Home screen"',
        'Tap "Add" to confirm',
      ].map((label, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm">{label}</p>
        </div>
      ))}
    </div>
  );
}
