import { notFound } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { GuestRsvpForm } from "@/components/events/guest-rsvp-form";
import { ShareButton } from "@/components/events/share-button";
import { VotingPanel } from "@/components/events/voting-panel";
import { EventTasksPanel } from "@/components/events/event-tasks-panel";
import { EventExpensesPanel } from "@/components/events/event-expenses-panel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership, getActiveMemberCount, listActiveMembers } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getEventWithDetails, listEventAttendees, listGuestAttendees } from "@/lib/queries/events";
import { getEventTasks, getEventExpenses } from "@/lib/queries/event-modules";
import { AttendeeList } from "@/components/events/attendee-list";
import { cancelEvent } from "@/lib/actions/events";
import { toggleEventModule } from "@/lib/actions/event-modules";

type Props = { params: Promise<{ slug: string; eventId: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug, eventId } = await params;
  const event = await getEventWithDetails(eventId);
  if (!event) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${siteUrl}/community/${slug}/events/${eventId}`;
  const description = event.description ?? `Join us for ${event.title} — Warriors on the Way`;
  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      url,
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: event.title,
      description,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug, eventId } = await params;

  const user = await requireUserProfile().catch(() => null);
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = user ? await getMembership(community.id, user.id) : null;
  const isMember = membership?.status === "active";

  // ── Guest / non-member path ────────────────────────────────────────────────
  // Anyone with the event link can view and RSVP as a guest
  if (!isMember) {
    const [event, guestAttendees] = await Promise.all([
      getEventWithDetails(eventId),
      listGuestAttendees(eventId),
    ]);
    if (!event) notFound();

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

    // Combine member + guest attendee names for a simple list
    const memberAttendees = event.status === "confirmed"
      ? await listEventAttendees(eventId)
      : [];
    const goingNames = [
      ...memberAttendees.filter((a) => a.status === "yes").map((a) => a.user.display_name),
      ...guestAttendees.filter((a) => a.status === "yes").map((a) => a.name),
    ];
    const maybeNames = [
      ...memberAttendees.filter((a) => a.status === "maybe").map((a) => a.user.display_name),
      ...guestAttendees.filter((a) => a.status === "maybe").map((a) => a.name),
    ];

    return (
      <>
        <AppNav />
        <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-6">
          <EventHeader event={event} slug={slug} shareUrl={shareUrl} />

          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="rounded-2xl overflow-hidden">
              <img src={event.image_url} alt="" className="w-full max-h-72 object-cover" />
            </div>
          )}

          <EventMeta event={event} />

          {event.description && (
            <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <Separator />

          {event.rsvp_counts && event.status === "confirmed" && (
            <RsvpCounts counts={event.rsvp_counts} />
          )}

          {event.status === "confirmed" && (goingNames.length > 0 || maybeNames.length > 0) && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              {goingNames.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Going</p>
                  <p className="text-base">{goingNames.join(", ")}</p>
                </div>
              )}
              {maybeNames.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Maybe</p>
                  <p className="text-base">{maybeNames.join(", ")}</p>
                </div>
              )}
            </div>
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

        </main>
      </>
    );
  }

  // ── Full member path ───────────────────────────────────────────────────────
  // membership and user are non-null here (isMember === true)
  if (!user || !membership) notFound();

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const event = await getEventWithDetails(eventId, user.id);
  if (!event) notFound();

  const [memberCount, attendees, guestAttendees, allMembers, tasks, expenses] = await Promise.all([
    getActiveMemberCount(community.id),
    listEventAttendees(eventId),
    listGuestAttendees(eventId),
    listActiveMembers(community.id),
    getEventTasks(eventId),
    getEventExpenses(eventId),
  ]);
  const isCreator = event.created_by === user.id;
  const canManage = isAdmin || isCreator;
  const isCancelled = event.status === "cancelled";

  const memberList = allMembers.map((m) => ({
    id: m.user.id,
    display_name: m.user.display_name,
    venmo_handle: m.user.venmo_handle,
  }));

  // Yes-RSVPs are the natural "group" for shared expenses
  const attendeeList = attendees
    .filter((a) => a.status === "yes")
    .map((a) => ({ id: a.user_id, display_name: a.user.display_name }));

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-6">
        <EventHeader event={event} slug={slug} shareUrl={shareUrl} />

        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="rounded-2xl overflow-hidden">
            <img src={event.image_url} alt="" className="w-full max-h-72 object-cover" />
          </div>
        )}

        <EventMeta event={event} />

        {event.description && (
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        <Separator />

        {event.rsvp_counts && event.status === "confirmed" && (
          <>
            <RsvpCounts counts={event.rsvp_counts} />
            {(attendees.length > 0 || guestAttendees.length > 0) && (
              <AttendeeList
                attendees={attendees}
                guestAttendees={guestAttendees}
                isAdmin={isAdmin}
                registrationFee={event.registration_fee}
                eventId={eventId}
                communitySlug={slug}
              />
            )}
          </>
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
            <p className="text-base font-medium">Your RSVP</p>
            <RsvpButtons
              eventId={event.id}
              communitySlug={slug}
              current={event.user_rsvp ?? null}
              registrationFee={event.registration_fee}
              creatorVenmo={event.creator.venmo_handle}
            />
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

            {/* Module toggles for admin/creator */}
            <div className="flex gap-2 flex-wrap pt-1">
              <form action={async () => {
                "use server";
                await toggleEventModule(eventId, "tasks_enabled", !event.tasks_enabled, slug);
              }}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    event.tasks_enabled && "border-primary text-primary"
                  )}
                >
                  {event.tasks_enabled ? "✓ Tasks on" : "Enable tasks"}
                </button>
              </form>
              <form action={async () => {
                "use server";
                await toggleEventModule(eventId, "expenses_enabled", !event.expenses_enabled, slug);
              }}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    event.expenses_enabled && "border-primary text-primary"
                  )}
                >
                  {event.expenses_enabled ? "✓ Expenses on" : "Enable expenses"}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Tasks module */}
        {event.tasks_enabled && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-base font-medium">Tasks</p>
              <EventTasksPanel
                eventId={eventId}
                communitySlug={slug}
                tasks={tasks}
                members={memberList}
                currentUserId={user.id}
                isAdmin={isAdmin}
              />
            </div>
          </>
        )}

        {/* Expenses module */}
        {event.expenses_enabled && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-base font-medium">Expenses</p>
              <EventExpensesPanel
                eventId={eventId}
                communitySlug={slug}
                expenses={expenses}
                members={memberList}
                attendees={attendeeList}
                currentUserId={user.id}
                currentUserVenmo={user.venmo_handle}
                eventStartsAt={event.starts_at}
              />
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
    registration_fee?: number | null;
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
      {event.registration_fee != null && event.registration_fee > 0 && (
        <p className="text-sm font-medium flex items-center gap-1.5">
          <span>💵</span> ${event.registration_fee.toFixed(2)} registration fee
        </p>
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
    <div className="flex gap-5 text-base">
      <span className="text-green-600 font-medium">✓ {counts.yes} going</span>
      <span className="text-muted-foreground">? {counts.maybe} maybe</span>
      <span className="text-muted-foreground">✗ {counts.no} can&apos;t go</span>
    </div>
  );
}

