import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunitySettingsForm } from "@/components/community/community-settings-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";

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

        <CommunitySettingsForm community={community} />
      </main>
    </>
  );
}
