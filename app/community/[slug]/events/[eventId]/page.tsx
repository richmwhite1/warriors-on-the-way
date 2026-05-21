import { notFound } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { GuestRsvpForm } from "@/components/events/guest-rsvp-form";
import { InviteModal } from "@/components/events/invite-modal";
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

type Props = {
  params: Promise<{ slug: string; eventId: string }>;
  searchParams: Promise<{ from?: string; note?: string }>;
};

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
      images: [
        {
          url: `${siteUrl}/community/${slug}/events/${eventId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: event.title,
      description,
      images: [`${siteUrl}/community/${slug}/events/${eventId}/opengraph-image`],
    },
  };
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { slug, eventId } = await params;
  const { from: inviterName, note: personalNote } = await searchParams;

  const user = await requireUserProfile().catch(() => null);
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = user ? await getMembership(community.id, user.id) : null;
  const isMember = membership?.status === "active";

  // ── Guest / non-member path — THE INVITATION EXPERIENCE ──────────────────
  if (!isMember) {
    const [event, guestAttendees] = await Promise.all([
      getEventWithDetails(eventId),
      listGuestAttendees(eventId),
    ]);
    if (!event) notFound();

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

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
    const totalGoing = goingNames.length;

    // Use inviter name from query, or fall back to event creator
    const hostDisplay = inviterName || event.creator.display_name;

    return (
      <main className="min-h-screen bg-background">
        {/* ── Hero image ──────────────────────────────────────────────── */}
        <div className="relative">
          {event.image_url ? (
            <div className="relative h-[44vh] min-h-[280px] max-h-[420px] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          ) : (
            <div className="h-32 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          )}
        </div>

        {/* ── Invitation card ─────────────────────────────────────────── */}
        <div className={cn(
          "relative mx-auto max-w-lg px-5 pb-12",
          event.image_url ? "-mt-24" : "pt-8"
        )}>

          {/* Invited-by line */}
          <div className="mb-5 space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              {inviterName ? "You're invited by" : "Hosted by"}
            </p>
            <p className="text-base font-medium">{hostDisplay}</p>
          </div>

          {/* Personal note */}
          {personalNote && (
            <div className="mb-6 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{decodeURIComponent(personalNote)}&rdquo;
              </p>
            </div>
          )}

          {/* Event title */}
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight leading-tight mb-2">
            {event.title}
          </h1>

          {event.status !== "confirmed" && (
            <Badge variant="secondary" className="capitalize mb-4">
              {event.status}
            </Badge>
          )}

          {/* Date & details — clean vertical layout */}
          <div className="mt-5 space-y-3">
            {event.starts_at && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">
                    {new Date(event.starts_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.starts_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {event.ends_at &&
                      ` — ${new Date(event.ends_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`}
                    {" "}&middot; {event.timezone.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.virtual_url && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <a
                  href={event.virtual_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Join virtually
                </a>
              </div>
            )}

            {event.registration_fee != null && event.registration_fee > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="font-medium">${event.registration_fee.toFixed(2)} registration fee</p>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="mt-6 text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          {/* Social proof — who's going */}
          {event.status === "confirmed" && totalGoing > 0 && (
            <div className="mt-6 flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                {goingNames.slice(0, 5).map((name, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-[10px] font-bold text-primary uppercase"
                  >
                    {name.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalGoing === 1
                  ? `${goingNames[0]} is going`
                  : totalGoing === 2
                    ? `${goingNames[0]} and ${goingNames[1]} are going`
                    : totalGoing <= 4
                      ? `${goingNames.slice(0, -1).join(", ")} and ${goingNames[totalGoing - 1]} are going`
                      : `${goingNames.slice(0, 2).join(", ")} and ${totalGoing - 2} others are going`}
              </p>
            </div>
          )}

          <Separator className="my-6" />

          {/* RSVP — the focal point */}
          {event.status === "confirmed" && (
            <GuestRsvpForm
              eventId={event.id}
              eventTitle={event.title}
              communitySlug={slug}
              shareUrl={shareUrl}
              goingNames={goingNames}
              maybeNames={maybeNames}
            />
          )}

          {event.status === "voting" && (
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              This event is still being scheduled. Sign in to vote on dates.
            </div>
          )}

          {/* Utility bar */}
          {event.starts_at && event.status === "confirmed" && (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`/api/events/${event.id}/calendar`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Add to calendar
              </a>
            </div>
          )}

          {/* Subtle branding footer */}
          <div className="mt-10 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground/60">
              Powered by{" "}
              <Link href="/" className="hover:text-foreground transition-colors">
                Warriors on the Way
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Full member path ───────────────────────────────────────────────────────
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

  const attendeeList = attendees
    .filter((a) => a.status === "yes")
    .map((a) => ({ id: a.user_id, display_name: a.user.display_name }));

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-6">
        <MemberEventHeader
          event={event}
          slug={slug}
          shareUrl={shareUrl}
          hostName={user.display_name}
        />

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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit gap-1.5")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Add to calendar
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

function MemberEventHeader({
  event,
  slug,
  shareUrl,
  hostName,
}: {
  event: { title: string; status: "draft" | "voting" | "confirmed" | "cancelled" };
  slug: string;
  shareUrl: string;
  hostName: string;
}) {
  return (
    <div className="space-y-3">
      <Link
        href={`/community/${slug}/events`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Events
      </Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-heading font-semibold">{event.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_COLORS[event.status]} className="capitalize">
            {event.status}
          </Badge>
          <InviteModal
            eventTitle={event.title}
            eventUrl={shareUrl}
            hostName={hostName}
          />
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
            {" "}&middot; {event.timezone.replace(/_/g, " ")}
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
