"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { unreadDMs?: number };

export function BottomNav({ unreadDMs = 0 }: Props) {
  const pathname = usePathname();

  const items = [
    {
      label: "Home",
      href: "/home",
      active: pathname === "/home",
      badge: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Communities",
      href: "/community",
      active: pathname.startsWith("/community"),
      badge: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      active: pathname.startsWith("/messages"),
      badge: unreadDMs,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      active: pathname === "/profile",
      badge: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden"
      style={{
        background: "rgba(26,22,16,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", height: 56 }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textDecoration: "none",
              borderTop: item.active ? "2px solid #a07828" : "2px solid transparent",
              color: item.active ? "#f8f7f4" : "#6b6456",
            }}
          >
            <span style={{ position: "relative" }}>
              {item.icon}
              {item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 14,
                    height: 14,
                    padding: "0 2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9999,
                    background: "#a07828",
                    color: "#ffffff",
                    fontSize: 9,
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
                fontFamily: "var(--font-brand)",
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
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
