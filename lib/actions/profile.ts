"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Real names: first name + last initial minimum. display_name is derived (a DB
  // trigger also keeps it in sync as "First L.").
  const first_name = (formData.get("first_name") as string)?.trim();
  const last_initial = (formData.get("last_initial") as string)?.trim().slice(0, 1).toUpperCase() || null;
  const birthdate = (formData.get("birthdate") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const venmo_handle = (formData.get("venmo_handle") as string)?.trim().replace(/^@/, "") || null;

  if (!first_name) throw new Error("Your first name is required");
  if (!last_initial) throw new Error("Your last initial is required");

  // 18+ only (also enforced by a DB trigger). Validate here for a friendly message.
  if (birthdate) {
    const dob = new Date(birthdate);
    const eighteen = new Date();
    eighteen.setFullYear(eighteen.getFullYear() - 18);
    if (dob > eighteen) throw new Error("You must be 18 or older to use this platform.");
  }

  const display_name = `${first_name}${last_initial ? ` ${last_initial}.` : ""}`;
  const update: Record<string, unknown> = {
    first_name, last_initial, display_name, bio, timezone, venmo_handle,
  };
  if (birthdate) update.birthdate = birthdate;

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
