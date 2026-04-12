"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function createEventTask(
  eventId: string,
  title: string,
  assignedTo: string | null,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("event_tasks").insert({
    event_id: eventId,
    created_by: user.id,
    title: title.trim(),
    assigned_to: assignedTo || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function toggleEventTask(
  taskId: string,
  completed: boolean,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("event_tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function deleteEventTask(
  taskId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("event_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

// ── Expenses ───────────────────────────────────────────────────────────────

export async function createEventExpense(
  eventId: string,
  description: string,
  amount: number,
  splitUserIds: string[],
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: expense, error } = await supabase
    .from("event_expenses")
    .insert({
      event_id: eventId,
      created_by: user.id,
      description: description.trim(),
      amount,
      paid_by: user.id,
    })
    .select("id")
    .single();
  if (error || !expense) throw new Error(error?.message ?? "Failed to create expense");

  // Create equal splits among selected members (excluding the payer)
  const others = splitUserIds.filter((id) => id !== user.id);
  const total = others.length + 1; // payer + others
  const each = Math.round((amount / total) * 100) / 100;

  if (others.length > 0) {
    const { error: splitError } = await supabase.from("expense_splits").insert(
      others.map((uid) => ({
        expense_id: expense.id,
        user_id: uid,
        amount: each,
      }))
    );
    if (splitError) throw new Error(splitError.message);
  }

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function deleteEventExpense(
  expenseId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("event_expenses").delete().eq("id", expenseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

// ── Payment confirmation ───────────────────────────────────────────────────

export async function markSplitPaid(
  splitId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("expense_splits")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("id", splitId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);

  // Notify the expense payer that their money is on the way (best-effort)
  try {
    const { data: split } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("id", splitId)
      .single();
    if (split) {
      const { data: expense } = await supabase
        .from("event_expenses")
        .select("paid_by, description")
        .eq("id", split.expense_id)
        .single();
      if (expense && expense.paid_by !== user.id) {
        const { data: payer } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();
        await createNotification(expense.paid_by, "expense_paid", {
          actor_name: (payer as { display_name?: string } | null)?.display_name ?? "Someone",
          description: (expense as { description?: string }).description ?? "an expense",
          event_id: eventId,
          community_slug: communitySlug,
        });
      }
    }
  } catch {
    // best-effort
  }
}

export async function confirmSplitReceived(
  splitId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Only the payer of the expense can confirm receipt
  const { data: split } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id")
    .eq("id", splitId)
    .single();

  if (!split) throw new Error("Split not found");

  const { data: expense } = await supabase
    .from("event_expenses")
    .select("paid_by, description")
    .eq("id", split.expense_id)
    .single();

  if (expense?.paid_by !== user.id) throw new Error("Only the payer can confirm receipt");

  const splitUserId = (split as { user_id?: string }).user_id;

  const { error } = await supabase
    .from("expense_splits")
    .update({ confirmed: true, confirmed_at: new Date().toISOString() })
    .eq("id", splitId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);

  // Notify the person whose payment was confirmed (best-effort)
  if (splitUserId && splitUserId !== user.id) {
    try {
      await createNotification(splitUserId, "expense_confirmed", {
        description: (expense as { description?: string }).description ?? "an expense",
        event_id: eventId,
        community_slug: communitySlug,
      });
    } catch {
      // best-effort
    }
  }
}

// ── Toggle modules (admin/organizer/creator only) ─────────────────────────

export async function toggleEventModule(
  eventId: string,
  module: "tasks_enabled" | "expenses_enabled",
  enabled: boolean,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("events")
    .update({ [module]: enabled })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}
