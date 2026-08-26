import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNeedBySlug,
  listOfferingsForNeed,
  listEventsForNeed,
  listPractitionersForNeed,
  listCommunitiesForNeed,
  thisWeek,
} from "@/lib/queries/needs";
import { getAuthUser } from "@/lib/queries/users";
import { AppNav } from "@/components/app-nav";
import { NeedIcon } from "@/components/needs/need-icon";
import { Doorway, type WeekCard } from "@/components/needs/doorway";
import { NeedSignupForm } from "@/components/needs/need-signup-form";

function eventDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// "Tomorrow 6:00 PM" reads faster than a date does when the whole point of the strip
// is how soon a thing is.
function weekLabel(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "long" })} · ${time}`;
}

export default async function NeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const need = await getNeedBySlug(slug);
  if (!need) notFound();

  const [circles, offerings, events, practitioners, user] = await Promise.all([
    listCommunitiesForNeed(need.id),
    listOfferingsForNeed(need.id),
    listEventsForNeed(need.id),
    listPractitionersForNeed(need.id),
    getAuthUser(),
  ]);

  const empty =
    circles.length === 0 && offerings.length === 0 && events.length === 0 && practitioners.length === 0;

  // Formatted server-side and passed down: the doorway is a client component, and a
  // date formatted in the browser after the server rendered a different one is a
  // hydration mismatch waiting on the first traveller in another timezone.
  const week: WeekCard[] = thisWeek(offerings, events).map((w) => ({
    id: w.id,
    href: w.href,
    title: w.title,
    whenLabel: weekLabel(w.when),
    community_name: w.community_name,
    format: w.format,
  }));

  const eventDates = Object.fromEntries(events.map((e) => [e.id, eventDate(e.starts_at)]));

  return (
    <>
      <AppNav />

      <main className="animate-page-enter mx-auto max-w-[560px] pb-20">
        {/* ── Need header ──────────────────────────────────────────────────── */}
        <header className="px-4 pb-1 pt-5">
          <Link href="/menu" className="font-heading text-[13px] font-bold text-primary no-underline">
            ← Menu
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[13px] bg-primary/[0.08]">
              <NeedIcon icon={need.icon} size={24} />
            </div>
            <h1 className="font-heading text-[1.9rem] font-extrabold tracking-[-0.02em] text-foreground">
              {need.name}
            </h1>
          </div>
          {need.prompt && (
            <p className="mt-3 font-sans text-[15px] italic leading-relaxed text-muted-foreground">
              &ldquo;{need.prompt}&rdquo;
            </p>
          )}
        </header>

        {/* An empty doorway is the highest-intent moment in the app — someone has just
            said exactly what they need. Spending it on "nothing here yet" wastes it, so
            the ask is to start the thing they were looking for — with a smaller yes
            beside it, because founding a circle is a large thing to ask of someone who
            came here because life feels heavy. */}
        {empty ? (
          <div className="px-4">
            <div className="mt-7 rounded-[20px] border border-border bg-card px-[1.35rem] py-6">
              <p className="font-heading text-[1.15rem] font-extrabold leading-[1.25] text-foreground">
                Nobody&rsquo;s opened this door yet
              </p>
              <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-muted-foreground">
                There&rsquo;s nothing here yet. If you&rsquo;re looking for it, chances are
                somebody nearby is too — starting it is how it begins.
              </p>
              <div className="mt-[1.15rem] flex flex-wrap gap-2.5">
                <Link
                  href={`/community/new?need=${need.slug}`}
                  className="press-scale rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-bold text-primary-foreground no-underline"
                >
                  Start a circle
                </Link>
                <Link
                  href="/community"
                  className="press-scale rounded-full border border-border px-5 py-2.5 font-heading text-sm font-bold text-foreground no-underline"
                >
                  Browse all communities
                </Link>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <p className="font-heading text-[15px] font-bold text-foreground">
                  Not ready to start one?
                </p>
                <p className="mt-1 font-sans text-sm leading-relaxed text-muted-foreground">
                  Leave your name here instead. When enough people ask for the same
                  doorway, that&rsquo;s how a circle gets founded — and you&rsquo;ll be the
                  first to hear.
                </p>
                <NeedSignupForm needId={need.id} needSlug={need.slug} signedIn={Boolean(user)} />
              </div>
            </div>
          </div>
        ) : (
          <Doorway
            circles={circles}
            offerings={offerings}
            events={events}
            practitioners={practitioners}
            week={week}
            eventDates={eventDates}
          />
        )}
      </main>
    </>
  );
}
