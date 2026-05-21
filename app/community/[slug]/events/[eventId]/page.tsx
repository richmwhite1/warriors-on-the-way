import { notFound } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { GuestRsvpForm } from "@/components/events/guest-rsvp-form";
import { InviteModal } from "@/components/events/invite-modal";
import { InvitationReveal } from "@/components/events/invitation-reveal";
import { StickyRsvpBar } from "@/components/events/sticky-rsvp-bar";
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

  // Build a rich description with date + social proof
  const parts: string[] = [];
  if (event.starts_at) {
    parts.push(
      new Date(event.starts_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }
  if (event.location) parts.push(event.location);
  const going = event.rsvp_counts?.yes ?? 0;
  if (going > 0) parts.push(`${going} ${going === 1 ? "person" : "people"} going`);

  const metaLine = parts.length > 0 ? parts.join(" · ") : "";
  const description = metaLine
    ? `${metaLine}${event.description ? ` — ${event.description.slice(0, 120)}` : ""}`
    : event.description ?? `Join us for ${event.title} — Warriors on the Way`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: `You're invited: ${event.title}`,
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
      title: `You're invited: ${event.title}`,
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

    // Countdown calculation
    const daysUntil = event.starts_at
      ? Math.ceil((new Date(event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const countdownLabel =
      daysUntil === null ? null :
      daysUntil <= 0 ? "Today" :
      daysUntil === 1 ? "Tomorrow" :
      daysUntil <= 7 ? `In ${daysUntil} days` :
      null;

    // Date parts for the calendar-page date card
    const dateObj = event.starts_at ? new Date(event.starts_at) : null;
    const monthShort = dateObj?.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const dayNum = dateObj?.getDate();
    const weekday = dateObj?.toLocaleDateString("en-US", { weekday: "long" });

    // Google Maps link for tappable location
    const mapsUrl = event.location
      ? `https://maps.google.com/?q=${encodeURIComponent(event.location)}`
      : null;

    return (
      <main className="min-h-screen bg-background">
        {/* ── Hero image ──────────────────────────────────────────────── */}
        <div className="relative">
          {event.image_url ? (
            <div className="relative h-[48vh] min-h-[300px] max-h-[460px] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              {/* Countdown badge — floats on hero */}
              {countdownLabel && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {countdownLabel}
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-40 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
              {countdownLabel && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {countdownLabel}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Invitation card ─────────────────────────────────────────── */}
        <InvitationReveal>
          <div className={cn(
            "relative mx-auto max-w-lg px-5 pb-32",
            event.image_url ? "-mt-28" : "pt-2"
          )}>

            {/* Invited-by pill */}
            <div className="mb-4 inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                {hostDisplay.charAt(0)}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {inviterName ? "Invited by" : "Hosted by"}
              </span>
              <span className="text-sm font-semibold text-foreground">{hostDisplay}</span>
            </div>

            {/* Personal note — styled as a handwritten card */}
            {personalNote && (
              <div className="mb-5 rounded-2xl bg-primary/5 border border-primary/10 px-5 py-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-full" />
                <p className="text-[15px] text-foreground/80 leading-relaxed italic pl-3">
                  &ldquo;{decodeURIComponent(personalNote)}&rdquo;
                </p>
              </div>
            )}

            {/* Event title */}
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight leading-tight mb-1">
              {event.title}
            </h1>

            {event.status !== "confirmed" && (
              <Badge variant="secondary" className="capitalize mb-4">
                {event.status}
              </Badge>
            )}

            {/* ── Date card + details — visual calendar page block ───── */}
            <div className="mt-6 flex gap-4">
              {/* Calendar page */}
              {dateObj && (
                <div className="shrink-0 w-16 h-[72px] rounded-xl border bg-card shadow-sm overflow-hidden text-center">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold tracking-widest py-0.5">
                    {monthShort}
                  </div>
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-2xl font-bold leading-none">{dayNum}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{weekday}</span>
                  </div>
                </div>
              )}

              {/* Time + location stacked */}
              <div className="flex-1 space-y-2.5 min-w-0">
                {event.starts_at && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {new Date(event.starts_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {event.ends_at &&
                          ` — ${new Date(event.ends_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.timezone.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium leading-tight text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline truncate"
                      >
                        {event.location}
                      </a>
                    ) : (
                      <p className="text-sm font-medium leading-tight truncate">{event.location}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Virtual link */}
            {event.virtual_url && (
              <div className="mt-3 flex items-center gap-2.5 ml-[80px]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <a
                  href={event.virtual_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Join virtually
                </a>
              </div>
            )}

            {/* Registration fee */}
            {event.registration_fee != null && event.registration_fee > 0 && (
              <div className="mt-3 flex items-center gap-2.5 ml-[80px]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium">${event.registration_fee.toFixed(2)} registration fee</p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            {/* Social proof — who's going */}
            {event.status === "confirmed" && totalGoing > 0 && (
              <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {goingNames.slice(0, 5).map((name, i) => (
                      <div
                        key={i}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-50 bg-green-100 text-xs font-bold text-green-700 uppercase"
                      >
                        {name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-green-800">
                    {totalGoing === 1
                      ? `${goingNames[0]} is going`
                      : totalGoing === 2
                        ? `${goingNames[0]} and ${goingNames[1]} are going`
                        : totalGoing <= 4
                          ? `${goingNames.slice(0, -1).join(", ")} and ${goingNames[totalGoing - 1]} are going`
                          : `${goingNames.slice(0, 2).join(", ")} and ${totalGoing - 2} others are going`}
                  </p>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* RSVP — the focal point */}
            {event.status === "confirmed" && (
              <div id="rsvp-section">
                <GuestRsvpForm
                  eventId={event.id}
                  eventTitle={event.title}
                  communitySlug={slug}
                  shareUrl={shareUrl}
                  goingNames={goingNames}
                  maybeNames={maybeNames}
                />
              </div>
            )}

            {event.status === "voting" && (
              <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                This event is still being scheduled. Sign in to vote on dates.
              </div>
            )}

            {/* Utility bar — add to calendar */}
            {event.starts_at && event.status === "confirmed" && (
              <div className="mt-5 flex items-center gap-3">
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
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Directions
                  </a>
                )}
              </div>
            )}

            {/* Subtle branding footer */}
            <div className="mt-10 pt-6 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                Powered by{" "}
                <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors">
                  Warriors on the Way
                </Link>
              </p>
            </div>
          </div>
        </InvitationReveal>

        {/* Sticky RSVP bar — appears when inline form scrolls out of view */}
        {event.status === "confirmed" && (
          <StickyRsvpBar eventTitle={event.title} targetId="rsvp-section" />
        )}
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
