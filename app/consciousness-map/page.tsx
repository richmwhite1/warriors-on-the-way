import { ConsciousnessMap } from "@/components/consciousness-map";
import Link from "next/link";

export const metadata = {
  title: "Map of Consciousness · Warriors on the Way",
  description:
    "An interactive exploration of David Hawkins' Scale of Consciousness — teachers and sacred texts calibrated from 200 to 1,000.",
};

export default function ConsciousnessMapPage() {
  return (
    <>
      {/* Minimal dark nav */}
      <div
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(6,4,10,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
        >
          ← Warriors on the Way
        </Link>
        <Link
          href="/sean"
          className="text-xs uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
        >
          Seán's Portal →
        </Link>
      </div>
      <ConsciousnessMap />
    </>
  );
}
