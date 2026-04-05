import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
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
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const event = await getEventWithDetails(eventId, user.id);
  if (!event) notFound();

  const memberCount = await getActiveMemberCount(community.id);
  const isCreator = event.created_by === user.id;
  const canManage = isAdmin || isCreator;
  const isCancelled = event.status === "cancelled";

  const STATUS_COLORS = { confirmed: "default", voting: "secondary", draft: "outline", cancelled: "destructive" } as const;

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Link href={`/community/${slug}/events`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Events
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-semibold">{event.title}</h1>
            <Badge variant={STATUS_COLORS[event.status]} className="capitalize shrink-0">
              {event.status}
            </Badge>
          </div>

          {/* Date / time */}
          {event.starts_at && (
            <div className="text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">
                {new Date(event.starts_at).toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
              <p className="text-sm">
                {new Date(event.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {event.ends_at && ` — ${new Date(event.ends_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
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
            <a href={event.virtual_url} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1.5">
              <span>🔗</span> Join virtually
            </a>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
        )}

        <Separator />

        {/* RSVP counts */}
        {event.rsvp_counts && event.status === "confirmed" && (
          <div className="flex gap-5 text-sm">
            <span className="text-green-600 font-medium">✓ {event.rsvp_counts.yes} going</span>
            <span className="text-muted-foreground">? {event.rsvp_counts.maybe} maybe</span>
            <span className="text-muted-foreground">✗ {event.rsvp_counts.no} can&apos;t go</span>
          </div>
        )}

        {/* Voting */}
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

        {/* RSVP */}
        {event.status === "confirmed" && !isCancelled && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your RSVP</p>
            <RsvpButtons eventId={event.id} communitySlug={slug} current={event.user_rsvp ?? null} />
          </div>
        )}

        {/* Add to calendar */}
        {event.starts_at && event.status === "confirmed" && (
          <a
            href={`/api/events/${event.id}/calendar`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
          >
            📅 Add to calendar
          </a>
        )}

        {/* Admin actions */}
        {canManage && !isCancelled && (
          <>
            <Separator />
            <div className="flex gap-3 flex-wrap">
              <Link href={`/community/${slug}/events/${eventId}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Edit event
              </Link>
              <form action={async () => {
                "use server";
                await cancelEvent(eventId, slug);
              }}>
                <button type="submit"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-destructive hover:text-destructive")}>
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
