import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PushSubscriptionToggle } from "@/components/profile/push-subscription-toggle";
import { LinkAccounts } from "@/components/profile/link-accounts";
import { requireUserProfile, getAuthUser } from "@/lib/queries/users";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";

export const metadata = { title: "Profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; next?: string }>;
}) {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const authUser = await getAuthUser();
  const identities = (authUser?.identities ?? []).map((i) => ({ provider: i.provider }));
  const params = await searchParams;
  const isWelcome = params.welcome === "true";
  const nextUrl = params.next;

  return (
    <>
      <AppNav />
      <div style={{ height: 60 }} />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem 6rem" }}>

        {isWelcome && (
          <div
            style={{
              background: "linear-gradient(135deg, #f8f4ec 0%, #fdf9f0 100%)",
              border: "1px solid #e8dcc8",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4, fontSize: "1rem" }}>
              Welcome! Set up your profile
            </p>
            <p style={{ color: "#7c7589", fontSize: "0.85rem", lineHeight: 1.4 }}>
              Add your name{!user.phone ? " and phone number" : ""} so your group knows who you are.
              {nextUrl && " You'll be redirected after saving."}
            </p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <SectionLabel>Your Profile</SectionLabel>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              color: "#1a1a2e",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              marginBottom: "0.25rem",
            }}
          >
            {user.display_name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "#7c7589",
              fontSize: "0.9rem",
            }}
          >
            How you appear to your groups.
          </p>
        </div>

        <AvatarUpload
          userId={user.id}
          displayName={user.display_name}
          avatarUrl={user.avatar_url}
        />

        <OrnamentalDivider />

        <ProfileForm user={user} redirectAfterSave={isWelcome ? (nextUrl || "/home") : undefined} />

        <OrnamentalDivider />

        <LinkAccounts identities={identities} phone={user.phone} />

        <OrnamentalDivider />

        <PushSubscriptionToggle />

      </main>
    </>
  );
}
