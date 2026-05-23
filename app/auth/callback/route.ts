import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/home";
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is a brand-new user with a placeholder name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();

        if (profile && /^(User \d{4}|New User)$/.test(profile.display_name)) {
          const welcomeNext = next !== "/home" ? `&next=${encodeURIComponent(next)}` : "";
          return NextResponse.redirect(`${origin}/profile?welcome=true${welcomeNext}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
