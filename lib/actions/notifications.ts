"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushToUser } from "@/lib/integrations/webpush";

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
}

// ─── Internal helpers (not exported as server actions) ───────────────────────

type NotificationType =
  | "event_created"
  | "event_updated"
  | "event_cancelled"
  | "rsvp_reminder"
  | "post_created"
  | "comment_on_post"
  | "member_joined"
  | "waitlist_spot_opened"
  | "join_request"
  | "report_actioned"
  | "dm_received";

const PUSH_TITLES: Partial<Record<NotificationType, string>> = {
  dm_received: "New message",
  join_request: "Join request",
  member_joined: "New member",
  event_created: "New event",
  waitlist_spot_opened: "Spot available",
  report_actioned: "Report reviewed",
};

function pushBody(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case "dm_received": return `${payload.actor_name ?? "Someone"}: ${payload.preview ?? ""}`;
    case "join_request": return `${payload.actor_name ?? "Someone"} wants to join`;
    case "member_joined": return `${payload.actor_name ?? "Someone"} joined ${payload.community_name ?? "your community"}`;
    case "event_created": return `${payload.title ?? "A new event"} in ${payload.community_name ?? "your community"}`;
    case "waitlist_spot_opened": return `A spot opened in ${payload.community_name ?? "a community"}`;
    case "report_actioned": return "A report you filed was reviewed";
    default: return "You have a new notification";
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({ user_id: userId, type, payload });

    // Also send a web push if the user has subscriptions
    const title = PUSH_TITLES[type] ?? "Warriors on the Way";
    const body = pushBody(type, payload);
    const url = (payload.community_slug && payload.event_id)
      ? `/community/${payload.community_slug}/events/${payload.event_id}`
      : payload.actor_id ? `/messages/${payload.actor_id}`
      : payload.community_slug ? `/community/${payload.community_slug}`
      : "/notifications";

    await sendWebPushToUser(userId, { title, body, url });
  } catch {
    // Notifications are best-effort — never block the main action
  }
}

/** Notify all admins + organizers of a community. */
export async function notifyCommunityAdmins(
  communityId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  excludeUserId?: string
) {
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .in("role", ["admin", "organizer"])
      .eq("status", "active");

    if (!admins?.length) return;

    const rows = admins
      .filter((a) => a.user_id !== excludeUserId)
      .map((a) => ({ user_id: a.user_id, type, payload }));

    if (rows.length) {
      await admin.from("notifications").insert(rows);
    }
  } catch {
    // best-effort
  }
}

/** Notify all active members of a community. */
export async function notifyCommunityMembers(
  communityId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  excludeUserId?: string
) {
  try {
    const admin = createAdminClient();
    const { data: members } = await admin
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("status", "active");

    if (!members?.length) return;

    const rows = members
      .filter((m) => m.user_id !== excludeUserId)
      .map((m) => ({ user_id: m.user_id, type, payload }));

    if (rows.length) {
      await admin.from("notifications").insert(rows);
    }
  } catch {
    // best-effort
  }
}
