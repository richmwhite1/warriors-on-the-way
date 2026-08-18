import type { ReactNode } from "react";

// Single source of truth for the app's navigation destinations. Both the mobile
// bottom bar and the desktop top bar derive from this, so the two never drift.
export type NavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => ReactNode;
};

const svg = (path: ReactNode, active: boolean) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={active ? 0 : 1.5}
  >
    {path}
  </svg>
);

// Primary destinations — the app's core surfaces. Rendered as icon tabs on mobile
// (bottom bar) and text links on desktop (top bar). "You" resolves to the avatar
// on desktop, so the top bar renders it via the avatar rather than as a text link.
export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Deck",
    href: "/deck",
    match: (p) => p === "/deck" || p === "/home",
    icon: (active) =>
      svg(
        active ? (
          <path d="M3.75 5.25A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 2.25v9A2.25 2.25 0 0118 16.5H6a2.25 2.25 0 01-2.25-2.25v-9zM6.75 19.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H6.75z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v8.25A2.25 2.25 0 0118 16.5H6a2.25 2.25 0 01-2.25-2.25V6zM7.5 20.25h9" />
        ),
        active,
      ),
  },
  {
    label: "Topics",
    href: "/topics",
    match: (p) => p.startsWith("/topics"),
    icon: (active) =>
      svg(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
        />,
        active,
      ),
  },
  {
    label: "Events",
    href: "/events",
    match: (p) => p.startsWith("/events"),
    icon: (active) =>
      svg(
        active ? (
          <path fillRule="evenodd" clipRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        ),
        active,
      ),
  },
  {
    label: "Communities",
    href: "/community",
    match: (p) => p.startsWith("/community"),
    icon: (active) =>
      svg(
        active ? (
          <path d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695zM1.5 17.25a3 3 0 013-3h.307A5.986 5.986 0 004.5 15.75v.75a.75.75 0 00.75.75h.008a13.29 13.29 0 00-.496 1.18.75.75 0 01-.653.57 11.166 11.166 0 01-2.609-.312V17.25zM22.5 17.25a3 3 0 00-3-3h-.307c.205.474.307.99.307 1.5v.75a.75.75 0 01-.75.75h-.008c.174.386.32.786.436 1.198a.75.75 0 00.706.502h.042a11.166 11.166 0 002.574-.312V17.25zM16.5 6a3 3 0 116 0 3 3 0 01-6 0zM1.5 6a3 3 0 116 0 3 3 0 01-6 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
        active,
      ),
  },
  {
    label: "You",
    href: "/profile",
    match: (p) => p === "/profile",
    icon: (active) =>
      svg(
        active ? (
          <path fillRule="evenodd" clipRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        ),
        active,
      ),
  },
];

// Secondary destinations — the reflective/guide surfaces. Text links in the top
// bar on every viewport (they don't compete for a thumb-reach tab slot).
export const SECONDARY_NAV: Pick<NavItem, "label" | "href" | "match">[] = [
  { label: "Seán", href: "/sean", match: (p) => p.startsWith("/sean") },
  { label: "Map", href: "/consciousness-map", match: (p) => p.startsWith("/consciousness-map") },
];
