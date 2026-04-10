import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { EventCard } from "@/components/events/event-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityEvents } from "@/lib/queries/events";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  return { title: `Events · ${c?.name ?? slug}` };
}

export default async function EventsPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  // Guests can view upcoming events but can't post or manage
  if (!user) {
    const events = await listCommunityEvents(community.id);
    const upcoming = events.filter((e) => e.status !== "cancelled" && (!e.starts_at || new Date(e.starts_at) >= new Date()));
    return (
      <>
        <AppNav />
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-heading font-semibold">{community.name} · Events</h1>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground">No upcoming events.</p>
          ) : (
            <section className="space-y-3">
              {upcoming.map((e) => <EventCard key={e.id} event={e} communitySlug={slug} />)}
            </section>
          )}
          <div className="rounded-2xl border bg-card p-5 space-y-2">
            <p className="font-medium text-sm">Want to RSVP or see more?</p>
            <Link href={`/sign-in?next=/community/${slug}/events`} className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          </div>
        </main>
      </>
    );
  }

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const canCreate = isAdmin || community.members_can_create_events;

  const events = await listCommunityEvents(community.id);
  const upcoming = events.filter((e) => e.status !== "cancelled" && (!e.starts_at || new Date(e.starts_at) >= new Date()));
  const past = events.filter((e) => e.status !== "cancelled" && e.starts_at && new Date(e.starts_at) < new Date());
  const cancelled = events.filter((e) => e.status === "cancelled");

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href={`/community/${slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← {community.name}
            </Link>
            <h1 className="text-2xl font-heading font-semibold mt-1">Events</h1>
          </div>
          {canCreate && (
            <Link href={`/community/${slug}/events/new`} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
              + New event
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
            <p className="text-muted-foreground">No events yet.</p>
            {canCreate && (
              <Link href={`/community/${slug}/events/new`} className={cn(buttonVariants(), "rounded-full")}>
                Create first event
              </Link>
            )}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Upcoming</h2>
                {upcoming.map((e) => <EventCard key={e.id} event={e} communitySlug={slug} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Past</h2>
                {past.map((e) => <EventCard key={e.id} event={e} communitySlug={slug} />)}
              </section>
            )}
            {cancelled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cancelled</h2>
                {cancelled.map((e) => <EventCard key={e.id} event={e} communitySlug={slug} />)}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
