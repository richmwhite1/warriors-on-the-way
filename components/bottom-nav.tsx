"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { unreadDMs?: number };

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(8);
  }
}

export function BottomNav({ unreadDMs = 0 }: Props) {
  const pathname = usePathname();

  const items = [
    {
      label: "Home",
      href: "/home",
      active: pathname === "/home",
      badge: 0,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28h-1.44v7.44a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-7.44H4.31a.75.75 0 01-.53-1.28l8.69-8.69z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          )}
        </svg>
      ),
    },
    {
      label: "Groups",
      href: "/community",
      active: pathname.startsWith("/community"),
      badge: 0,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695zM1.5 17.25a3 3 0 013-3h.307A5.986 5.986 0 004.5 15.75v.75a.75.75 0 00.75.75h.008a13.29 13.29 0 00-.496 1.18.75.75 0 01-.653.57 11.166 11.166 0 01-2.609-.312V17.25zM22.5 17.25a3 3 0 00-3-3h-.307c.205.474.307.99.307 1.5v.75a.75.75 0 01-.75.75h-.008c.174.386.32.786.436 1.198a.75.75 0 00.706.502h.042a11.166 11.166 0 002.574-.312V17.25zM16.5 6a3 3 0 116 0 3 3 0 01-6 0zM1.5 6a3 3 0 116 0 3 3 0 01-6 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          )}
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      active: pathname.startsWith("/messages"),
      badge: unreadDMs,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      active: pathname === "/profile",
      badge: 0,
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path fillRule="evenodd" clipRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          )}
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden"
      style={{
        background: "rgba(255,255,255,0.95)",
        borderTop: "1px solid #e8e2da",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", height: 56 }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => !item.active && vibrate()}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textDecoration: "none",
              color: item.active ? "#e07040" : "#7c7589",
              transition: "color 0.2s ease",
            }}
          >
            <span style={{ position: "relative", transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)" }}>
              {item.icon(item.active)}
              {item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 18,
                    height: 18,
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9999,
                    background: "#e07040",
                    color: "#ffffff",
                    fontSize: 10,
                    fontFamily: "var(--font-brand)",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: item.active ? 600 : 500,
                letterSpacing: "0.01em",
              }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
