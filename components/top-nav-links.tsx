"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/components/nav-config";

// Desktop top-bar links. Primary destinations mirror the mobile bottom bar (minus
// "You", which the avatar covers) and only show at sm+, since mobile reaches them
// via the bottom bar. Secondary destinations show at every width.
export function TopNavLinks() {
  const pathname = usePathname();

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--primary)" : "var(--muted-foreground)",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  const primary = PRIMARY_NAV.filter((i) => i.href !== "/profile");

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

      {/* Secondary — every width */}
      {SECONDARY_NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} style={linkStyle(active)}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
