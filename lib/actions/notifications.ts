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
  | "rsvp_created"
  | "post_created"
  | "comment_on_post"
  | "member_joined"
  | "waitlist_spot_opened"
  | "join_request"
  | "report_actioned"
  | "dm_received"
  | "expense_paid"
  | "expense_confirmed"
  | "expense_reminder"
  | "add_venmo";

const PUSH_TITLES: Partial<Record<NotificationType, string>> = {
  dm_received: "New message",
  join_request: "Join request",
  member_joined: "New member",
  event_created: "New event",
  rsvp_created: "New RSVP",
  post_created: "New post",
  comment_on_post: "New comment",
  waitlist_spot_opened: "Spot available",
  report_actioned: "Report reviewed",
  expense_paid: "Payment received",
  expense_confirmed: "Payment confirmed",
  expense_reminder: "Payment reminder",
  add_venmo: "Add your Venmo",
};

function pushBody(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case "dm_received": return `${payload.actor_name ?? "Someone"}: ${payload.preview ?? ""}`;
    case "join_request": return `${payload.actor_name ?? "Someone"} wants to join`;
    case "member_joined": return `${payload.actor_name ?? "Someone"} joined ${payload.community_name ?? "your community"}`;
    case "event_created": return `${payload.title ?? "A new event"} in ${payload.community_name ?? "your community"}`;
    case "rsvp_created": return `${payload.actor_name ?? "Someone"} is attending ${payload.event_title ?? "your event"}`;
    case "post_created": return `New post in ${payload.community_name ?? "your community"}`;
    case "comment_on_post": return `${payload.actor_name ?? "Someone"} commented on your post`;
    case "waitlist_spot_opened": return `A spot opened in ${payload.community_name ?? "a community"}`;
    case "report_actioned": return "A report you filed was reviewed";
    case "expense_paid": return `${payload.actor_name ?? "Someone"} paid you for ${payload.description ?? "an expense"}`;
    case "expense_confirmed": return `Your payment for ${payload.description ?? "an expense"} was confirmed`;
    case "expense_reminder": return `You owe $${payload.amount ?? "?"} for ${payload.description ?? "an expense"} at ${payload.event_title ?? "an event"}`;
    case "add_venmo": return `Add your Venmo handle so group expense payments are easy`;
    default: return "You have a new notification";
  }
}

function buildUrl(type: NotificationType, payload: Record<string, unknown>): string {
  if (type === "add_venmo") {
    return "/profile";
  }
  if (type === "comment_on_post" && payload.community_slug && payload.post_id) {
    return `/community/${payload.community_slug}#post-${payload.post_id}`;
  }
  if (type === "dm_received" && payload.actor_id) {
    return `/messages/${payload.actor_id as string}`;
  }
  if (payload.community_slug && payload.event_id) {
    return `/community/${payload.community_slug}/events/${payload.event_id}`;
  }
  if (payload.community_slug) {
    return `/community/${payload.community_slug as string}`;
  }
  return "/notifications";
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({ user_id: userId, type, payload });

    const title = PUSH_TITLES[type] ?? "Warriors on the Way";
    const body = pushBody(type, payload);
    const url = buildUrl(type, payload);
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

    const targets = admins.filter((a) => a.user_id !== excludeUserId);
    if (!targets.length) return;

    await admin.from("notifications").insert(
      targets.map((a) => ({ user_id: a.user_id, type, payload }))
    );

    const title = PUSH_TITLES[type] ?? "Warriors on the Way";
    const body = pushBody(type, payload);
    const url = buildUrl(type, payload);
    await Promise.allSettled(
      targets.map((a) => sendWebPushToUser(a.user_id, { title, body, url }))
    );
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

    const targets = members.filter((m) => m.user_id !== excludeUserId);
    if (!targets.length) return;

    await admin.from("notifications").insert(
      targets.map((m) => ({ user_id: m.user_id, type, payload }))
    );

    const title = PUSH_TITLES[type] ?? "Warriors on the Way";
    const body = pushBody(type, payload);
    const url = buildUrl(type, payload);
    await Promise.allSettled(
      targets.map((m) => sendWebPushToUser(m.user_id, { title, body, url }))
    );
  } catch {
    // best-effort
  }
}
