import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PushSubscriptionToggle } from "@/components/profile/push-subscription-toggle";
import { requireUserProfile } from "@/lib/queries/users";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            How you appear to your communities.
          </p>
        </div>

        <AvatarUpload
          userId={user.id}
          displayName={user.display_name}
          avatarUrl={user.avatar_url}
        />

        <Separator />

        <ProfileForm user={user} />

        <Separator />

        <PushSubscriptionToggle />
      </main>
    </>
  );
}
