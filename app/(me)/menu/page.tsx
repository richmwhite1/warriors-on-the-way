import Link from "next/link";
import { getNeedsWithSignal, getMyNeedIds, type NeedSignal } from "@/lib/queries/needs";
import { AppNav } from "@/components/app-nav";
import { NeedIcon } from "@/components/needs/need-icon";
import { daysUntilEvent, formatEventDate } from "@/lib/event-time";

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
    // Calendar days on the gathering's own clock. Dividing elapsed milliseconds and
    // rounding called anything 12–36 hours out "tomorrow", so a Saturday event read as
    // "next tomorrow" on Thursday.
    const days = daysUntilEvent(n.next_at, n.next_tz) ?? 0;
    const when =
      days <= 0 ? "today" : days === 1 ? "tomorrow" : days <= 6
        ? formatEventDate(n.next_at, n.next_tz, { weekday: "long" })
        : formatEventDate(n.next_at, n.next_tz, { month: "short", day: "numeric" });
    parts.push(`next ${when}`);
  }

  return { text: parts.join(" · "), live: true };
}

// The chapter front door — Shannon's warm "menu for local spiritual needs".
// People arrive by felt need (how they show up), not by mission (the why).
export default async function MenuPage() {
  // The front door asks "what are you looking for?" and Profile asked the identical
  // question, so the two read as rival copies of the same control. They are one thing:
  // both write user_needs. Reading the answer back here makes that visible — the doorways
  // you follow say so — instead of leaving the state stranded on a settings page.
  // getMyNeedIds returns [] for guests, so this stays safe on a public page.
  const [needs, myNeedIds] = await Promise.all([getNeedsWithSignal(), getMyNeedIds()]);
  const following = new Set(myNeedIds);

  return (
    <>
      <AppNav />

      <main className="animate-page-enter mx-auto max-w-[560px] pb-20 lg:max-w-[900px]">
        {/* ── Mission frame: Seán's why, wrapping everything ────────────────── */}
        <section className="px-4 pb-2 pt-5 lg:max-w-[620px]">
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
        <div className="grid gap-3 p-4 lg:grid-cols-2">
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
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="font-heading text-[1.25rem] font-bold leading-tight text-foreground">
                      {need.name}
                    </h2>
                    {following.has(need.id) && (
                      <span className="rounded-full bg-primary/10 px-2 py-[3px] font-heading text-[10.5px] font-bold uppercase tracking-[0.06em] text-primary">
                        Following
                      </span>
                    )}
                  </div>
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

        {/* Only shown once there is something to manage — a guest with nothing followed
            gets no nag, and the link lands on the bulk editor for these same rows. */}
        {following.size > 0 && (
          <p className="px-4 font-sans text-[13px] leading-relaxed text-muted-foreground">
            You&rsquo;ll hear when a circle opens behind{" "}
            {following.size === 1 ? "the doorway" : `${following.size} of the doorways`} you
            follow.{" "}
            <Link href="/profile" className="font-semibold text-primary no-underline">
              Change that →
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
