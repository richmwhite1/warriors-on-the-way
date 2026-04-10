import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DirectMessage } from "@/lib/queries/messages";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function MessageBubble({
  message,
  currentUserId,
}: {
  message: DirectMessage;
  currentUserId: string;
}) {
  const isMe = message.sender_id === currentUserId;
  const initials = message.sender.display_name.slice(0, 2).toUpperCase();

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && (
        <Avatar size="sm" className="shrink-0 mb-0.5">
          {message.sender.avatar_url && (
            <AvatarImage src={message.sender.avatar_url} alt={message.sender.display_name} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[75%] group ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isMe
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          }`}
        >
          {message.body}
        </div>
        <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
