import { ConsciousnessMap } from "@/components/consciousness-map";
import { ContemplativeNav } from "@/components/contemplative-nav";
import Link from "next/link";

export const metadata = {
  title: "Map of Consciousness · Warriors on the Way",
  description:
    "An interactive exploration of David Hawkins' Scale of Consciousness — teachers and sacred texts calibrated from 200 to 1,000.",
};

export default function ConsciousnessMapPage() {
  return (
    <>
      <ContemplativeNav current="map" />
      <ConsciousnessMap />
      {/* The map is something to contemplate, with nothing to do at the end of it.
          One quiet way back into the app, in its own voice. */}
      <div
        className="px-6 py-10 text-center"
        style={{ background: "#060409", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="mx-auto max-w-md text-sm leading-relaxed text-stone-400">
          Nobody climbs a scale alone. The people doing this work meet in person, in small
          circles, and it costs nothing to sit down with them.
        </p>
        <Link
          href="/community"
          className="mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-bold no-underline"
          style={{ background: "#D4AF37", color: "#1a1200" }}
        >
          Find a circle near you
        </Link>
      </div>
    </>
  );
}
