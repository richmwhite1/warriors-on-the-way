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

export async function signInWithPhone(phone: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
}

export async function verifyPhoneOtp(phone: string, token: string, next?: string) {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw new Error(error.message);

  // Redirect new users (placeholder name) to profile to set their name
  if (data.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", data.user.id)
      .single();

    if (profile && /^User \d{4}$/.test(profile.display_name)) {
      redirect(`/profile?welcome=true${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    }
  }

  redirect(next ?? "/home");
}

export async function linkGoogleAccount() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/profile` },
  });
  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
