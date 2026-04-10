import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { MemberList } from "@/components/community/member-list";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import {
  getMembership,
  listActiveMembers,
  listWaitlistedMembers,
} from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";

type Props = { params: Promise<{ slug: string }> };

export default async function MembersPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  const isMember = membership?.status === "active";

  // Private communities: only members can see the list
  if (community.is_private && !isMember) redirect(`/community/${slug}`);

  const isAdmin = isMember && (membership?.role === "admin" || membership?.role === "organizer");

  const [activeMembers, pendingMembers] = await Promise.all([
    listActiveMembers(community.id),
    isAdmin ? listWaitlistedMembers(community.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/community/${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {community.name}
            </Link>
            <h1 className="text-2xl font-heading font-semibold mt-1">Members</h1>
          </div>
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none")}>
            {activeMembers.length} / {community.member_cap}
          </span>
        </div>

        <MemberList
          members={activeMembers}
          pendingMembers={pendingMembers}
          communitySlug={slug}
          isAdmin={isAdmin}
          currentUserId={user.id}
        />
      </main>
    </>
  );
}
