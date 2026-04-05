import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { CreateEventForm } from "@/components/events/create-event-form";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "New event" };

export default async function NewEventPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  if (!isAdmin && !community.members_can_create_events) redirect(`/community/${slug}/events`);

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <Link href={`/community/${slug}/events`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Events
          </Link>
          <h1 className="text-2xl font-heading font-semibold mt-1">New event</h1>
          <p className="text-sm text-muted-foreground mt-1">{community.name}</p>
        </div>
        <CreateEventForm communityId={community.id} communitySlug={slug} />
      </main>
    </>
  );
}
