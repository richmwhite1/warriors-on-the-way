import { SeanPortal } from "@/components/sean-portal";
import Link from "next/link";

export const metadata = {
  title: "Seán Ó'Laoire · Spiritual Director",
  description:
    "Transmissions, chronicles, and live conversations with Warriors on the Way Spiritual Director Seán Ó'Laoire.",
};

export default function SeanPage() {
  return (
    <>
      {/* Minimal back nav — keeps the cinematic dark aesthetic intact */}
      <div
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(8,6,4,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
        >
          ← Warriors on the Way
        </Link>
        <Link
          href="/consciousness-map"
          className="text-xs uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
        >
          Map of Consciousness →
        </Link>
      </div>
      <SeanPortal />
    </>
  );
}
