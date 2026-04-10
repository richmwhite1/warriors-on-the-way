"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import type { DirectMessage } from "@/lib/queries/messages";

type Props = {
  initialMessages: DirectMessage[];
  currentUserId: string;
  recipientId: string;
  recipientName: string;
};

export function ConversationFeed({
  initialMessages,
  currentUserId,
  recipientId,
  recipientName,
}: Props) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dm:${[currentUserId, recipientId].sort().join(":")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            read_at: string | null;
            created_at: string;
          };

          // Only messages in this conversation
          const isThisConvo =
            (row.sender_id === currentUserId && row.recipient_id === recipientId) ||
            (row.sender_id === recipientId && row.recipient_id === currentUserId);
          if (!isThisConvo) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const senderId = row.sender_id;
            const isMe = senderId === currentUserId;
            const newMsg: DirectMessage = {
              ...row,
              sender: isMe
                ? { id: currentUserId, display_name: "You", avatar_url: null }
                : { id: recipientId, display_name: recipientName, avatar_url: null },
            };
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId, recipientName]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Start your conversation with {recipientName}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput recipientId={recipientId} />
    </>
  );
}
