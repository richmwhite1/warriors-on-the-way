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
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        <div className="text-center space-y-3">
          <Link
            href={`/community/${slug}/events`}
            className="inline-block text-[11px] uppercase tracking-[0.25em] text-[#6b6456] hover:text-[#1a1610] transition-colors"
          >
            ← Back to events
          </Link>
          <div
            className="text-[11px] uppercase tracking-[0.35em] text-[#a07828]"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            {community.name}
          </div>
          <h1
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#1a1610",
            }}
          >
            Call a gathering
          </h1>
          <p
            className="italic text-[#6b6456] max-w-md mx-auto"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Name the circle, choose the hour, and invite the warriors to come home.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="h-px w-8 bg-[#c8c2b4]" />
            <span className="text-[#a07828]" style={{ fontFamily: "var(--font-brand)" }}>✦</span>
            <span className="h-px w-8 bg-[#c8c2b4]" />
          </div>
        </div>
        <div
          className="relative p-6 sm:p-10"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(8px)",
            border: "1px solid #ede9e1",
            boxShadow:
              "0 1px 2px rgba(26,22,16,0.04), 0 20px 48px -24px rgba(160,120,40,0.18)",
          }}
        >
          <CreateEventForm communityId={community.id} communitySlug={slug} />
        </div>
      </main>
    </>
  );
}
