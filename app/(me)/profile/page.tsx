import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PushSubscriptionToggle } from "@/components/profile/push-subscription-toggle";
import { LinkAccounts } from "@/components/profile/link-accounts";
import { MyNeedsForm } from "@/components/profile/my-needs-form";
import { requireUserProfile, getAuthUser } from "@/lib/queries/users";
import { getFulfilledAsksForUser } from "@/lib/queries/asks";
import { getNeeds, getMyNeedIds } from "@/lib/queries/needs";
import { FulfilledAsks } from "@/components/asks/fulfilled-asks";
import { signOut } from "@/lib/actions/auth";
import { smsEnabled } from "@/lib/phone";
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
  const fulfilledAsks = await getFulfilledAsksForUser(user.id);
  const [needs, myNeedIds] = await Promise.all([getNeeds(), getMyNeedIds()]);
  const params = await searchParams;
  const isWelcome = params.welcome === "true";
  const nextUrl = params.next;

  return (
    <>
      <AppNav />
      <div style={{ height: 60 }} />
      <main className="animate-page-enter" style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem 6rem" }}>

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
            <p style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: 4, fontSize: "1rem" }}>
              Welcome! Set up your profile
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", lineHeight: 1.4 }}>
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
              color: "var(--foreground)",
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
              color: "var(--muted-foreground)",
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

        <FulfilledAsks asks={fulfilledAsks} name={user.display_name} />

        <OrnamentalDivider />

        <ProfileForm user={user} redirectAfterSave={isWelcome ? (nextUrl || "/menu") : undefined} smsEnabled={smsEnabled()} />

        <OrnamentalDivider />

        <MyNeedsForm needs={needs} selected={myNeedIds} />

        <OrnamentalDivider />

        <LinkAccounts identities={identities} phone={user.phone} />

        <OrnamentalDivider />

        <PushSubscriptionToggle />

        <OrnamentalDivider />

        <form action={signOut}>
          <button
            type="submit"
            style={{
              width: "100%",
              fontFamily: "var(--font-brand)",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--muted-foreground)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </form>

      </main>
    </>
  );
}
