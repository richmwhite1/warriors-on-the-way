import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "@/lib/queries/messages";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationItem({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const { otherUser, lastMessage, lastMessageAt, unreadCount, lastSenderId } = conversation;
  const initials = otherUser.display_name.slice(0, 2).toUpperCase();
  const isUnread = unreadCount > 0;
  const preview = lastSenderId === currentUserId ? `You: ${lastMessage}` : lastMessage;

  return (
    <Link
      href={`/messages/${otherUser.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors rounded-xl"
    >
      <Avatar>
        {otherUser.avatar_url && <AvatarImage src={otherUser.avatar_url} alt={otherUser.display_name} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "font-medium"}`}>
            {otherUser.display_name}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
            {preview}
          </p>
          {isUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
