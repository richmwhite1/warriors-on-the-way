"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const display_name = (formData.get("display_name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const venmo_handle = (formData.get("venmo_handle") as string)?.trim().replace(/^@/, "") || null;

  if (!display_name) throw new Error("Display name is required");

  const update: Record<string, unknown> = { display_name, bio, timezone, venmo_handle };

  // Phone/SMS fields are only in the form when Twilio is configured — when it
  // isn't, leave the columns untouched so a later enable keeps existing data.
  const { smsEnabled, normalizePhone } = await import("@/lib/phone");
  if (smsEnabled()) {
    const notify_sms = formData.get("notify_sms") === "on";
    const rawPhone = (formData.get("phone") as string)?.trim() || null;
    let phone: string | null = null;
    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone) throw new Error("Invalid phone number. Please use a US number like (555) 123-4567.");
    }

    const smsOptIn = notify_sms && !!phone;
    update.phone = phone;
    update.notify_sms = smsOptIn;
    // TCPA recordkeeping: timestamp each affirmative opt-in. Opt-outs keep the
    // historical consent record; notify_sms governs whether we actually send.
    if (smsOptIn) {
      update.sms_consent_at = new Date().toISOString();
      update.sms_consent_source = "profile_form";
    }
  }

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/home");
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/home");
}
