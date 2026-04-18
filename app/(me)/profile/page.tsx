import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PushSubscriptionToggle } from "@/components/profile/push-subscription-toggle";
import { requireUserProfile } from "@/lib/queries/users";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  return (
    <>
      <AppNav />
      <div style={{ height: 60 }} />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <SectionLabel>Your Profile</SectionLabel>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              color: "#1a1610",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: "0.5rem",
            }}
          >
            {user.display_name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              color: "#6b6456",
              fontSize: "1rem",
            }}
          >
            How you appear to your communities.
          </p>
        </div>

        <AvatarUpload
          userId={user.id}
          displayName={user.display_name}
          avatarUrl={user.avatar_url}
        />

        <OrnamentalDivider />

        <ProfileForm user={user} />

        <OrnamentalDivider />

        <PushSubscriptionToggle />

      </main>
    </>
  );
}
