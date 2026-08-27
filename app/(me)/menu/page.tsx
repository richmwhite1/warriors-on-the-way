import Link from "next/link";
import { getNeedsWithSignal, type NeedSignal } from "@/lib/queries/needs";
import { AppNav } from "@/components/app-nav";
import { NeedIcon } from "@/components/needs/need-icon";

// What's actually behind this door, in the fewest words that are still true.
//
// The six doors used to look identically promising, so choosing between them was a coin
// flip — and a wrong flip landed on "nobody's opened this door yet". Someone who came
// here because life feels heavy does not have a second guess in them. Putting the honest
// state on the front means the busy doors advertise themselves and the quiet ones read
// as an invitation to found, rather than a dead end discovered one tap too late.
function signalLine(n: NeedSignal): { text: string; live: boolean } {
  const parts: string[] = [];
  if (n.circles) parts.push(`${n.circles} circle${n.circles === 1 ? "" : "s"}`);
  if (n.offerings) parts.push(`${n.offerings} ongoing`);
  if (n.events) parts.push(`${n.events} gathering${n.events === 1 ? "" : "s"}`);

  // Five of the six doors are usually quiet, so this line renders five times on the
  // front page. "Nobody's opened this door yet" made the entrance report emptiness five
  // times before anyone had opened anything — an accurate sentence that reads as a dead
  // product. Same fact, stated as the opening it actually is.
  if (parts.length === 0) {
    return { text: "Be the first to open this →", live: false };
  }

  if (n.next_at) {
    const d = new Date(n.next_at);
    const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
    const when =
      days <= 0 ? "today" : days === 1 ? "tomorrow" : days <= 6
        ? d.toLocaleDateString("en-US", { weekday: "long" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    parts.push(`next ${when}`);
  }

  return { text: parts.join(" · "), live: true };
}

// The chapter front door — Shannon's warm "menu for local spiritual needs".
// People arrive by felt need (how they show up), not by mission (the why).
export default async function MenuPage() {
  const needs = await getNeedsWithSignal();

  return (
    <>
      <AppNav />

      <main className="animate-page-enter mx-auto max-w-[560px] pb-20">
        {/* ── Mission frame: Seán's why, wrapping everything ────────────────── */}
        <section className="px-4 pb-2 pt-5">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Salt Lake City &amp; Park City
          </p>
          <h1 className="mt-1.5 font-heading text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground">
            What are you looking for?
          </h1>
          {/* Plain words first, the words this community uses second. "Pick a doorway"
              assumed you already knew what a doorway was, and what was behind it — two
              pieces of vocabulary before anyone had earned them. */}
          <p className="mt-2.5 font-sans text-[15px] leading-relaxed text-muted-foreground">
            Free, always — nobody ever charges to gather. Each doorway below opens onto{" "}
            <span className="font-semibold text-foreground">circles</span>: small groups
            that meet in person near you.{" "}
            <Link href="/sean" className="font-semibold text-primary no-underline">
              Why this exists →
            </Link>
          </p>
        </section>

        {/* ── The six doorways ─────────────────────────────────────────────── */}
        <div className="grid gap-3 p-4">
          {needs.map((need) => {
            const signal = signalLine(need);
            return (
              <Link
                key={need.id}
                href={`/needs/${need.slug}`}
                className="press-scale animate-fade-up flex items-start gap-3.5 rounded-[20px] border border-border bg-card p-[18px] no-underline"
              >
                <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-primary/[0.08]">
                  <NeedIcon icon={need.icon} size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-[1.25rem] font-bold leading-tight text-foreground">
                    {need.name}
                  </h2>
                  {need.prompt && (
                    <p className="mt-1.5 font-sans text-sm italic leading-[1.45] text-muted-foreground">
                      &ldquo;{need.prompt}&rdquo;
                    </p>
                  )}
                  <p
                    className={`mt-2 font-sans text-[12.5px] font-semibold ${
                      signal.live ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {signal.live && (
                      <span
                        aria-hidden
                        className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-primary align-middle"
                      />
                    )}
                    {signal.text}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
