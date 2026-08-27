"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/components/nav-config";

// Desktop top-bar links. Primary destinations mirror the mobile bottom bar (minus
// "You", which the avatar covers) and only show at sm+, since mobile reaches them
// via the bottom bar.
//
// The secondary destinations — The Nine, Seán, the Map — used to sit beside them as
// three loose text links at every width. On mobile that inverted the whole app: the
// primary links were hidden behind the bottom bar, so the only things visible in the
// top bar were the three philosophy pages. The supporting material outranked the core
// loop. They now collapse into one "Discover" menu, which is also the honest shape —
// they are things to read, not places to do the three jobs people come here for.
export function TopNavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on navigation — the menu outlives the click that left it otherwise.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--primary)" : "var(--muted-foreground)",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  const primary = PRIMARY_NAV.filter((i) => i.href !== "/profile");
  const secondaryActive = SECONDARY_NAV.some((i) => i.match(pathname));

  return (
    <>
      {/* Primary — desktop only (mobile uses the bottom bar) */}
      <div className="hidden sm:flex" style={{ alignItems: "center", gap: "1rem" }}>
        {primary.map((item) => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} style={linkStyle(active)}>
              {item.label}
            </Link>
          );
        })}
        <span aria-hidden style={{ width: 1, height: 18, background: "var(--border)" }} />
      </div>

      {/* Secondary — one entry point at every width */}
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          style={{
            ...linkStyle(secondaryActive),
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: 0,
            padding: "6px 0",
            cursor: "pointer",
            minHeight: 32,
          }}
        >
          Discover
          <svg
            aria-hidden
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Discover"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 180,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 6,
              boxShadow: "0 16px 40px rgba(26,22,16,0.18)",
              zIndex: 60,
            }}
          >
            {SECONDARY_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "block",
                    padding: "9px 12px",
                    borderRadius: 9,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--primary)" : "var(--foreground)",
                    background: active ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                  <span
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "var(--muted-foreground)",
                      marginTop: 1,
                    }}
                  >
                    {item.blurb}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
