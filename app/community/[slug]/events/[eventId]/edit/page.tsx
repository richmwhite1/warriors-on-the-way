import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { EditEventForm } from "@/components/events/edit-event-form";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getEventWithDetails } from "@/lib/queries/events";

type Props = { params: Promise<{ slug: string; eventId: string }> };

export default async function EditEventPage({ params }: Props) {
  const { slug, eventId } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}/events/${eventId}/edit`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const event = await getEventWithDetails(eventId, user.id);
  if (!event) notFound();

  const canManage = isAdmin || event.created_by === user.id;
  if (!canManage) redirect(`/community/${slug}/events/${eventId}`);

  if (event.status === "cancelled") redirect(`/community/${slug}/events/${eventId}`);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link
            href={`/community/${slug}/events/${eventId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to event
          </Link>
          <h1 className="text-2xl font-heading font-semibold mt-2">Edit event</h1>
        </div>

        <EditEventForm
          eventId={eventId}
          communitySlug={slug}
          initialValues={{
            title: event.title,
            description: event.description ?? "",
            location: event.location ?? "",
            virtual_url: event.virtual_url ?? "",
            starts_at: event.starts_at ? toDatetimeLocal(event.starts_at) : "",
            ends_at: event.ends_at ? toDatetimeLocal(event.ends_at) : "",
            image_url: (event as unknown as { image_url?: string | null }).image_url ?? null,
          }}
        />
      </main>
    </>
  );
}

function toDatetimeLocal(iso: string) {
  // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
  return iso.slice(0, 16);
}
