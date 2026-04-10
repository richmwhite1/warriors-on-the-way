import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireUserProfile, getUserProfile } from "@/lib/queries/users";
import { UserReportForm } from "@/components/profile/user-report-form";
import { BackButton } from "@/components/ui/back-button";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const profile = await getUserProfile(userId);
  return { title: profile?.display_name ?? "Profile" };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;

  const currentUser = await requireUserProfile().catch(() => null);
  if (!currentUser) redirect(`/sign-in?next=/profile/${userId}`);

  // Redirect self to own profile editor
  if (userId === currentUser.id) redirect("/profile");

  const profile = await getUserProfile(userId);
  if (!profile) notFound();

  const initials = profile.display_name.slice(0, 2).toUpperCase();

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <BackButton />

        {/* Profile card */}
        <div className="flex items-start gap-5">
          <Avatar className="size-16 shrink-0">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            )}
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-heading font-semibold">{profile.display_name}</h1>
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/messages/${profile.id}`}
            className={cn(buttonVariants(), "rounded-full")}
          >
            Send message
          </Link>
        </div>

        {/* Report section */}
        <UserReportForm targetUserId={profile.id} targetName={profile.display_name} />
      </main>
    </>
  );
}
