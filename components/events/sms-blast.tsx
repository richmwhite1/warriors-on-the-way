"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { smsEventAttendees } from "@/lib/actions/events";
import { toast } from "sonner";

type Props = {
  eventId: string;
  communitySlug: string;
};

export function SmsBlast({ eventId, communitySlug }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      try {
        const { sent } = await smsEventAttendees(eventId, communitySlug, message);
        if (sent === 0) {
          toast.info("No attendees have a phone number with texts enabled.");
        } else {
          toast.success(`Text sent to ${sent} ${sent === 1 ? "person" : "people"} going.`);
        }
        setMessage("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Text everyone going
      </Button>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Text everyone going</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sends an SMS to all confirmed attendees who opted in to texts. Use it
          for day-of changes — new location, late start, weather call.
        </p>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={320}
        placeholder="We're moving to the north pavilion — see you at 10!"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSend} disabled={isPending || !message.trim()}>
          {isPending ? "Sending…" : "Send text"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setMessage(""); }}>
          Cancel
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">{message.length}/320</span>
      </div>
    </div>
  );
}
