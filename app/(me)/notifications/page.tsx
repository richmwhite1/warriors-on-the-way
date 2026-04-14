import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { requireUserProfile } from "@/lib/queries/users";
import { listNotifications } from "@/lib/queries/notifications";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata = { title: "Notifications" };

const TYPE_LABELS: Record<string, string> = {
  event_created: "New event",
  event_updated: "Event updated",
  event_cancelled: "Event cancelled",
  rsvp_reminder: "RSVP reminder",
  rsvp_created: "New RSVP",
  post_created: "New post",
  comment_on_post: "New comment",
  member_joined: "New member",
  waitlist_spot_opened: "Waitlist spot opened",
  join_request: "Join request",
  report_actioned: "Report actioned",
  dm_received: "New message",
  expense_paid: "Payment received",
  expense_confirmed: "Payment confirmed",
  expense_reminder: "Payment reminder",
  add_venmo: "Action needed",
};

function notificationSummary(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case "event_created":
    case "event_updated":
    case "event_cancelled":
      return (payload.title as string) ?? "An event was updated";
    case "post_created":
      return (payload.community_name as string)
        ? `New post in ${payload.community_name}`
        : "A new post was shared";
    case "comment_on_post":
      return (payload.actor_name as string)
        ? `${payload.actor_name} commented on your post`
        : "Someone commented on your post";
    case "rsvp_created":
      return (payload.actor_name as string)
        ? `${payload.actor_name} is attending ${(payload.event_title as string) ?? "your event"}`
        : "Someone RSVPed to your event";
    case "expense_paid":
      return (payload.actor_name as string)
        ? `${payload.actor_name} paid you for ${(payload.description as string) ?? "an expense"}`
        : "Someone paid you for an expense";
    case "expense_confirmed":
      return `Your payment for ${(payload.description as string) ?? "an expense"} was confirmed`;
    case "expense_reminder":
      return `You owe $${(payload.amount as string) ?? "?"} for ${(payload.description as string) ?? "an expense"} — tap to pay`;
    case "add_venmo":
      return "Add your Venmo handle to your profile so others can pay you for shared expenses";
    case "member_joined":
      return (payload.actor_name as string)
        ? `${payload.actor_name} joined your community`
        : "A new member joined";
    case "waitlist_spot_opened":
      return (payload.community_name as string)
        ? `A spot opened in ${payload.community_name}`
        : "A waitlist spot opened";
    case "join_request":
      return (payload.actor_name as string)
        ? `${payload.actor_name} requested to join`
        : "Someone requested to join";
    case "report_actioned":
      return "A report you filed was reviewed";
    case "dm_received":
      return (payload.actor_name as string)
        ? `Message from ${payload.actor_name}`
        : "You have a new message";
    default:
      return "You have a new notification";
  }
}

function notificationLink(type: string, payload: Record<string, unknown>): string | null {
  if (type === "add_venmo") {
    return "/profile";
  }
  if (type === "dm_received" && payload.actor_id) {
    return `/messages/${payload.actor_id}`;
  }
  if (type === "comment_on_post" && payload.community_slug && payload.post_id) {
    return `/community/${payload.community_slug}#post-${payload.post_id}`;
  }
  if (payload.community_slug && payload.event_id) {
    return `/community/${payload.community_slug}/events/${payload.event_id}`;
  }
  if (payload.community_slug) {
    return `/community/${payload.community_slug}`;
  }
  return null;
}

export default async function NotificationsPage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold">Notifications</h1>
            {unread > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{unread} unread</p>
            )}
          </div>
          {unread > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Mark all read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            No notifications yet. Activity from your communities will appear here.
          </div>
        ) : (
          <div className="divide-y rounded-2xl border overflow-hidden">
            {notifications.map((n) => {
              const link = notificationLink(n.type, n.payload);
              const label = TYPE_LABELS[n.type] ?? n.type;
              const summary = notificationSummary(n.type, n.payload);
              const isUnread = !n.read_at;

              const inner = (
                <div className={cn("px-4 py-3 flex items-start gap-3", isUnread && "bg-primary/5")}>
                  {isUnread && (
                    <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                  )}
                  {!isUnread && <span className="mt-1.5 size-2 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm mt-0.5">{summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );

              const notifId = n.id;
              const dest = link ?? "/notifications";
              return link ? (
                <form
                  key={notifId}
                  action={async () => {
                    "use server";
                    if (isUnread) await markNotificationRead(notifId);
                    redirect(dest);
                  }}
                  className="block"
                >
                  <button type="submit" className="block w-full text-left hover:bg-muted/50 transition-colors">
                    {inner}
                  </button>
                </form>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
