import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { CreateCommunityForm } from "@/components/community/create-community-form";
import { requireUserProfile } from "@/lib/queries/users";

export const metadata = { title: "Create community" };

export default async function NewCommunityPage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Create a community</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You&apos;ll be the organizer. Communities are capped at 150 members.
          </p>
        </div>
        <CreateCommunityForm />
      </main>
    </>
  );
}
