import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { JoinButton } from "@/components/community/join-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [membership, memberCount] = await Promise.all([
    getMembership(community.id, user.id),
    getActiveMemberCount(community.id),
  ]);

  const memberStatus = membership?.status ?? "none";
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  const isFull = memberCount >= community.member_cap;

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-heading font-semibold">{community.name}</h1>
                {community.is_parent && (
                  <Badge variant="secondary">North Star</Badge>
                )}
                {community.is_private && (
                  <Badge variant="outline">Private</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {memberCount} / {community.member_cap} members
                {isFull && (
                  <span className="ml-2 text-destructive font-medium">· Full</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href={`/community/${slug}/members`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Manage members
                </Link>
              )}
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                status={memberStatus as "none" | "active" | "waitlisted" | "pending_approval" | "banned"}
                isFull={isFull}
              />
            </div>
          </div>

          {community.description && (
            <p className="text-muted-foreground">{community.description}</p>
          )}
        </div>

        <Separator />

        {/* Feed placeholder — Phase 2 builds this */}
        {memberStatus === "active" ? (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">Community wall</h2>
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              Posts and events coming in Phase 2 & 3.
            </div>
          </div>
        ) : memberStatus === "waitlisted" ? (
          <div className="rounded-2xl border p-8 text-center space-y-2">
            <p className="font-heading font-semibold">You&apos;re on the waitlist</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll let you know when a spot opens up.
            </p>
          </div>
        ) : memberStatus === "pending_approval" ? (
          <div className="rounded-2xl border p-8 text-center space-y-2">
            <p className="font-heading font-semibold">Request pending</p>
            <p className="text-sm text-muted-foreground">
              An admin will review your request shortly.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            Join this community to see its wall.
          </div>
        )}
      </main>
    </>
  );
}
