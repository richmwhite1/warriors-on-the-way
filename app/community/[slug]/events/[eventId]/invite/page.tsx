import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { InvitePanel } from "@/components/events/invite-panel";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getEventWithDetails } from "@/lib/queries/events";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

type Props = { params: Promise<{ slug: string; eventId: string }> };

export const metadata = { title: "Invite people" };

export default async function InvitePage({ params }: Props) {
  const { slug, eventId } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const event = await getEventWithDetails(eventId);
  if (!event) notFound();

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/community/${slug}/events/${eventId}`;

  return (
    <>
      <AppNav />
      <main className="max-w-lg mx-auto px-4 pt-20 pb-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold">Event created!</h1>
          <p className="text-muted-foreground mt-1">
            Now share <span className="font-medium text-foreground">{event.title}</span> with your people.
          </p>
        </div>

        {/* Invite panel */}
        <InvitePanel
          eventTitle={event.title}
          eventUrl={shareUrl}
          hostName={user.display_name}
        />

        {/* Skip link */}
        <div className="text-center mt-6">
          <Link
            href={`/community/${slug}/events/${eventId}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
          >
            Skip for now — go to event
          </Link>
        </div>
      </main>
    </>
  );
}
