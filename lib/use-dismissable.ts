"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard dismissable-overlay behaviour: Escape closes, focus moves into the
 * panel and cycles inside it, and focus returns to whatever opened it.
 *
 * Several overlays in this app closed only by clicking the backdrop, which
 * leaves keyboard users stuck. Wire this into anything that renders over the
 * page.
 */
export function useDismissable<T extends HTMLElement, Trig extends HTMLElement = HTMLElement>({
  open,
  onClose,
  trapFocus = true,
}: {
  open: boolean;
  onClose: () => void;
  trapFocus?: boolean;
}) {
  const panelRef = useRef<T>(null);
  const triggerRef = useRef<Trig>(null);
  const wasOpen = useRef(false);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) {
      // Only restore focus after a close the user actually caused.
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

    if (trapFocus) {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (!trapFocus || e.key !== "Tab") return;

      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
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
  }, [open, close, trapFocus]);

  return { panelRef, triggerRef };
}
