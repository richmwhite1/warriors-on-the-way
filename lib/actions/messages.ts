"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendDirectMessage(recipientId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");
  if (recipientId === user.id) throw new Error("Cannot message yourself");

  const { error } = await supabase.from("direct_messages").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    body: trimmed,
  });

  if (error) throw new Error(error.message);

  // Notify recipient only if they don't already have an unread dm_received from us
  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", recipientId)
    .eq("type", "dm_received")
    .is("read_at", null)
    .contains("payload", { actor_id: user.id });

  if (!count) {
    const { data: sender } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    await createNotification(recipientId, "dm_received", {
      actor_id: user.id,
      actor_name: sender?.display_name ?? "Someone",
      preview: trimmed.slice(0, 80),
    });
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${recipientId}`);
}

export async function markConversationRead(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", otherUserId)
    .is("read_at", null)
    .is("deleted_at", null);

  revalidatePath("/messages");
  revalidatePath(`/messages/${otherUserId}`);
}
