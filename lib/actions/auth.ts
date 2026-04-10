"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const callbackUrl = next
    ? `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`
    : `${SITE_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl },
  });

  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

export async function signInWithMagicLink(email: string, next?: string) {
  const supabase = await createClient();
  const callbackUrl = next
    ? `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`
    : `${SITE_URL}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  });

  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
