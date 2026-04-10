"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reportUser } from "@/lib/actions/reports";
import { toast } from "sonner";

type Props = { targetUserId: string; targetName: string };

export function UserReportForm({ targetUserId, targetName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    startTransition(async () => {
      try {
        await reportUser(targetUserId, reason);
        setOpen(false);
        setReason("");
        toast.success("Report submitted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit report");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        Report {targetName}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">Report {targetName}</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue…"
        rows={3}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !reason.trim()}>
          Submit report
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setReason(""); }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
