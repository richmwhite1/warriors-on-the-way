import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { GuestRsvpForm } from "@/components/events/guest-rsvp-form";
import { ShareButton } from "@/components/events/share-button";
import { VotingPanel } from "@/components/events/voting-panel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership, getActiveMemberCount } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getEventWithDetails } from "@/lib/queries/events";
import { cancelEvent } from "@/lib/actions/events";

type Props = { params: Promise<{ slug: string; eventId: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { slug, eventId } = await params;

  const user = await requireUserProfile().catch(() => null);
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  // ── Guest path (not signed in) ─────────────────────────────────────────────
  if (!user) {
    if (community.allow_guest_rsvp === false) redirect(`/sign-in?next=/community/${slug}/events/${eventId}`);

    const event = await getEventWithDetails(eventId);
    if (!event) notFound();

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

    return (
      <>
        <AppNav />
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <EventHeader event={event} slug={slug} />
          <EventMeta event={event} />

          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <Separator />

          {event.rsvp_counts && event.status === "confirmed" && (
            <RsvpCounts counts={event.rsvp_counts} />
          )}

          {event.status === "confirmed" && (
            <GuestRsvpForm
              eventId={event.id}
              eventTitle={event.title}
              communitySlug={slug}
              shareUrl={shareUrl}
            />
          )}

          {event.status === "voting" && (
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              This event is still being scheduled. Sign in to vote on dates.
            </div>
          )}

          <Separator />

          {/* Soft CTA to join */}
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <p className="font-medium">Want the full experience?</p>
            <p className="text-sm text-muted-foreground">
              Sign in to see the community wall, connect with members, and get event updates.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/sign-in?next=/community/${slug}/events/${eventId}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Sign in
              </Link>
              <Link
                href={`/community/${slug}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View {community.name}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ── Authenticated path ─────────────────────────────────────────────────────
  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const event = await getEventWithDetails(eventId, user.id);
  if (!event) notFound();

  const memberCount = await getActiveMemberCount(community.id);
  const isCreator = event.created_by === user.id;
  const canManage = isAdmin || isCreator;
  const isCancelled = event.status === "cancelled";

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <EventHeader event={event} slug={slug} shareUrl={shareUrl} />
        <EventMeta event={event} />

        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        <Separator />

        {event.rsvp_counts && event.status === "confirmed" && (
          <RsvpCounts counts={event.rsvp_counts} />
        )}

        {event.status === "voting" && event.date_options && event.date_options.length > 0 && (
          <VotingPanel
            eventId={event.id}
            communitySlug={slug}
            options={event.date_options}
            threshold={event.vote_threshold}
            totalMembers={memberCount}
            isAdmin={isAdmin}
          />
        )}

        {event.status === "confirmed" && !isCancelled && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your RSVP</p>
            <RsvpButtons eventId={event.id} communitySlug={slug} current={event.user_rsvp ?? null} />
          </div>
        )}

        {event.starts_at && event.status === "confirmed" && (
          <a
            href={`/api/events/${event.id}/calendar`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
          >
            📅 Add to calendar
          </a>
        )}

        {canManage && !isCancelled && (
          <>
            <Separator />
            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/community/${slug}/events/${eventId}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit event
              </Link>
              <form action={async () => {
                "use server";
                await cancelEvent(eventId, slug);
              }}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-destructive hover:text-destructive")}
                >
                  Cancel event
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

const STATUS_COLORS = {
  confirmed: "default",
  voting: "secondary",
  draft: "outline",
  cancelled: "destructive",
} as const;

function EventHeader({
  event,
  slug,
  shareUrl,
}: {
  event: { title: string; status: "draft" | "voting" | "confirmed" | "cancelled" };
  slug: string;
  shareUrl?: string;
}) {
  return (
    <div className="space-y-3">
      <Link
        href={`/community/${slug}/events`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Events
      </Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-heading font-semibold">{event.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_COLORS[event.status]} className="capitalize">
            {event.status}
          </Badge>
          {shareUrl && (
            <ShareButton
              title={event.title}
              text={`Join us — ${event.title}`}
              url={shareUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EventMeta({
  event,
}: {
  event: {
    starts_at: string | null;
    ends_at: string | null;
    timezone: string;
    location: string | null;
    virtual_url: string | null;
  };
}) {
  return (
    <div className="space-y-2">
      {event.starts_at && (
        <div className="text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">
            {new Date(event.starts_at).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm">
            {new Date(event.starts_at).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
            {event.ends_at &&
              ` — ${new Date(event.ends_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}`}
            {" "}· {event.timezone.replace(/_/g, " ")}
          </p>
        </div>
      )}
      {event.location && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <span>📍</span> {event.location}
        </p>
      )}
      {event.virtual_url && (
        <a
          href={event.virtual_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1.5"
        >
          <span>🔗</span> Join virtually
        </a>
      )}
    </div>
  );
}

function RsvpCounts({
  counts,
}: {
  counts: { yes: number; no: number; maybe: number };
}) {
  return (
    <div className="flex gap-5 text-sm">
      <span className="text-green-600 font-medium">✓ {counts.yes} going</span>
      <span className="text-muted-foreground">? {counts.maybe} maybe</span>
      <span className="text-muted-foreground">✗ {counts.no} can&apos;t go</span>
    </div>
  );
}
