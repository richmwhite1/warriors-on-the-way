import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * A null member_cap means the circle is uncapped (parent communities are).
 * Rendering `{count} / {cap}` blindly produced a dangling "9 / " on those.
 */
export function formatMembership(count: number, cap: number | null | undefined): string {
  const noun = count === 1 ? "member" : "members";
  if (cap == null) return `${count} ${noun}`;
  return `${count} / ${cap} ${noun}`;
}

/** Short form for tight spots (badges, pills): "9" or "9 / 150". */
export function formatMembershipShort(count: number, cap: number | null | undefined): string {
  return cap == null ? `${count}` : `${count} / ${cap}`;
}

/**
 * Locations are stored as typed, so "salt lake city" and "Salt Lake City" sit
 * next to each other in the same list. Normalise at render time.
 */
export function titleCasePlace(value: string | null | undefined): string {
  if (!value) return "";
  const small = new Set(["of", "the", "and", "de", "del", "la", "las", "los", "on", "in", "at", "by"]);
  return value
    .trim()
    .split(/(\s+|,\s*|-)/)
    .map((part, i) => {
      if (/^(\s+|,\s*|-)$/.test(part)) return part;
      const lower = part.toLowerCase();
      // Keep deliberate acronyms and mixed case the author already chose.
      if (part.length > 1 && part === part.toUpperCase() && /[A-Z]/.test(part)) return part;
      if (i > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}
