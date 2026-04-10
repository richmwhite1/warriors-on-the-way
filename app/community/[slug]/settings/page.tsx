import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunitySettingsForm } from "@/components/community/community-settings-form";
import { InviteLink } from "@/components/community/invite-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityResources } from "@/lib/queries/resources";
import { ResourcesAdmin } from "@/components/community/resources-admin";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community ? `Settings · ${community.name}` : "Settings" };
}

export default async function CommunitySettingsPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  if (!isAdmin) redirect(`/community/${slug}`);

  const resources = await listCommunityResources(community.id);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={`/community/${slug}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 text-muted-foreground")}
        >
          ← Back to {community.name}
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-semibold">Community settings</h1>
          <p className="text-sm text-muted-foreground">Manage info, access, Telegram, and more.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Member reports</p>
            <p className="text-xs text-muted-foreground mt-0.5">Review content flagged by members</p>
          </div>
          <Link
            href={`/community/${slug}/reports`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View reports
          </Link>
        </div>

        <InviteLink
          communityId={community.id}
          communitySlug={slug}
          currentToken={(community as unknown as { invite_token?: string | null }).invite_token ?? null}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />

        <CommunitySettingsForm community={community} />

        {community.is_parent && (
          <div id="resources" className="pt-4">
            <ResourcesAdmin
              communityId={community.id}
              communitySlug={slug}
              initialResources={resources}
            />
          </div>
        )}
      </main>
    </>
  );
}
