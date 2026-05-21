"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  eventTitle: string;
  eventUrl: string;
  hostName: string;
};

export function InvitePanel({ eventTitle, eventUrl, hostName }: Props) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  function buildUrl() {
    const url = new URL(
      eventUrl.startsWith("/") ? `${window.location.origin}${eventUrl}` : eventUrl
    );
    url.searchParams.set("from", hostName);
    if (note.trim()) url.searchParams.set("note", note.trim());
    return url.toString();
  }

  async function handleCopy() {
    const link = buildUrl();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  async function handleNativeShare() {
    const link = buildUrl();
    const shareText = note.trim()
      ? `${note.trim()}\n\n${eventTitle}`
      : `You're invited to ${eventTitle}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, text: shareText, url: link });
        return;
      } catch {
        // fell through
      }
    }
    await handleCopy();
  }

  async function handleSms() {
    const link = buildUrl();
    const body = note.trim()
      ? `${note.trim()}\n\n${link}`
      : `You're invited to ${eventTitle}!\n\n${link}`;
    window.open(`sms:?&body=${encodeURIComponent(body)}`, "_self");
  }

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-5">
      {/* Personal note */}
      <div className="space-y-1.5">
        <Label htmlFor="invite-note">
          Add a personal note <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <textarea
          id="invite-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Hey! Would love for you to come to this..."
          maxLength={280}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{note.length}/280</p>
      </div>

      {/* Preview of what the recipient will see */}
      <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Preview</p>
        <p className="text-xs text-muted-foreground">
          {hostName} invited you
        </p>
        {note.trim() && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{note.trim()}&rdquo;</p>
        )}
        <p className="text-sm font-semibold">{eventTitle}</p>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Button onClick={handleNativeShare} size="lg" className="w-full gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share invite
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleSms} className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text invite
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
