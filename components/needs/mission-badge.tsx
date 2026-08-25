import Link from "next/link";
import type { MissionBadge as MissionBadgeData } from "@/lib/queries/needs";

// The small mission tag that rides on every offering/event/practitioner card —
// this is how Seán's nine missions stay forefront while people navigate by need.
// e.g. a yoga card carries "Healing". Links to the mission's "why" page.
export function MissionBadge({ mission }: { mission: MissionBadgeData }) {
  if (!mission) return null;
  return (
    <Link
      href={`/topics/${mission.slug}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-brand)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--primary)",
        background: "color-mix(in srgb, var(--primary) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
        borderRadius: 999,
        padding: "3px 9px",
        textDecoration: "none",
        width: "fit-content",
      }}
    >
      <span aria-hidden style={{ fontSize: 9 }}>◆</span>
      {mission.name}
    </Link>
  );
}
