"use client";

import { useRef, useTransition } from "react";
import { sendDirectMessage } from "@/lib/actions/messages";
import { toast } from "sonner";

export function MessageInput({ recipientId }: { recipientId: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const body = ref.current?.value.trim() ?? "";
    if (!body) return;

    startTransition(async () => {
      try {
        await sendDirectMessage(recipientId, body);
        if (ref.current) ref.current.value = "";
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send message");
      }
    });
  }

  return (
    <div className="border-t bg-background px-4 py-3 flex items-end gap-2">
      <textarea
        ref={ref}
        rows={1}
        placeholder="Message…"
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="flex-1 resize-none rounded-xl border bg-muted/40 px-3.5 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-32 overflow-y-auto"
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <button
        onClick={submit}
        disabled={isPending}
        className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        Send
      </button>
    </div>
  );
}
