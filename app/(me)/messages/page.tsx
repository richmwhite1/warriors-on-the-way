import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { requireUserProfile } from "@/lib/queries/users";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-heading font-semibold">Messages</h1>
          <p className="text-muted-foreground text-sm">Direct messages with community members</p>
        </div>

        <div className="rounded-2xl border border-dashed p-12 flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <svg className="size-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground">Direct messages coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll be able to message members of your communities here.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
