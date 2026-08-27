import Link from "next/link";

// Shared chrome for the dark, contemplative surfaces — Seán's portal and the Map.
//
// These pages felt like a different product, and the dark palette was only half the
// reason. The other half was that each had hand-rolled its own header, with slightly
// different backgrounds (rgba(8,6,4,.85) vs rgba(6,4,10,.88)) and a back-link pointing
// at "/" — the public landing page — so the way out of a contemplative page was out of
// the app entirely. One header, one palette, and a way back to the front door makes the
// darkness read as a deliberate room inside the house rather than a different building.
//
// The dark treatment itself is kept: it is the Gothic-noir voice these two pages are
// written in, and flattening it to match the light app would cost more than it saves.

type Surface = "sean" | "map";

const DESTINATIONS: Record<Surface, { href: string; label: string }> = {
  sean: { href: "/sean", label: "Seán's Portal" },
  map: { href: "/consciousness-map", label: "Map of Consciousness" },
};

const linkCls =
  "text-xs uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors no-underline";

export function ContemplativeNav({ current }: { current: Surface }) {
  const sibling = DESTINATIONS[current === "sean" ? "map" : "sean"];

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3"
      style={{
        background: "rgba(8,6,6,0.86)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Back into the app, not out to the marketing page. */}
      <Link href="/menu" className={linkCls}>
        ← Warriors on the Way
      </Link>
      <Link href={sibling.href} className={linkCls}>
        {sibling.label} →
      </Link>
    </div>
  );
}
