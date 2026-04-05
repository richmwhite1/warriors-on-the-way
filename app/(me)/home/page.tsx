import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-heading font-semibold text-foreground">
          Welcome home
        </h1>
        <p className="text-muted-foreground">
          Your communities will appear here. Phase 1 builds this out.
        </p>
        <p className="text-xs text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>
    </main>
  );
}
