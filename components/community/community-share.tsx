"use client";

import { useEffect, useState } from "react";
import { useDismissable } from "@/lib/use-dismissable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ShareCore = {
  communityName: string;
  /** Relative path, e.g. /community/bay-area-seekers */
  communityUrl: string;
  inviterName: string;
  /** Instant-join token — only passed for admins/organizers. */
  inviteToken?: string | null;
};

function buildUrl(
  { communityUrl, inviterName, inviteToken }: ShareCore,
  note: string,
) {
  const base = communityUrl.startsWith("/")
    ? `${window.location.origin}${communityUrl}`
    : communityUrl;
  const url = new URL(base);
  if (inviteToken) url.searchParams.set("invite", inviteToken);
  if (inviterName) url.searchParams.set("from", inviterName);
  if (note.trim()) url.searchParams.set("note", note.trim());
  return url.toString();
}

/** The shared modal used by both the Invite button and the recruit panel. */
function ShareModal({
  core,
  open,
  onClose,
}: {
  core: ShareCore;
  open: boolean;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const { panelRef } = useDismissable<HTMLDivElement>({ open, onClose });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildUrl(core, note));
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  async function handleNativeShare() {
    const link = buildUrl(core, note);
    const text = note.trim()
      ? `${note.trim()}\n\n${core.communityName}`
      : `Join ${core.communityName} on Warriors on the Way`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: core.communityName, text, url: link });
        onClose();
        return;
      } catch {
        // cancelled — fall through to copy
      }
    }
    await handleCopy();
  }

  function handleSms() {
    const link = buildUrl(core, note);
    const body = note.trim()
      ? `${note.trim()}\n\n${link}`
      : `Come join ${core.communityName}!\n\n${link}`;
    window.open(`sms:?&body=${encodeURIComponent(body)}`, "_self");
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Invite someone to ${core.communityName}`}
        tabIndex={-1}
        className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-md rounded-2xl border bg-card shadow-2xl"
      >
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-heading font-semibold">Invite someone</h2>
            <p className="text-sm text-muted-foreground">
              Share <span className="font-medium text-foreground">{core.communityName}</span> — communities grow one invite at a time.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="community-invite-note">
              Add a personal note <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <textarea
              id="community-invite-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thought of you — I think you'd love this group…"
              maxLength={280}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/280</p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleNativeShare} className="w-full gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share invite
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleSms} className="gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Text invite
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

/** Compact Invite button for the community action row. */
export function CommunityShareButton(props: ShareCore & { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {props.label ?? "Invite"}
      </Button>
      <ShareModal core={props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Celebrated "recruit your first four" panel, shown to stewards while a community
 * is still forming (under the five-member go-live threshold). Auto-opens the share
 * sheet right after creation (autoOpen).
 */
export function RecruitProgress(
  props: ShareCore & { memberCount: number; threshold?: number; autoOpen?: boolean },
) {
  const threshold = props.threshold ?? 5;
  const remaining = Math.max(threshold - props.memberCount, 0);
  const pct = Math.min(Math.round((props.memberCount / threshold) * 100), 100);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (props.autoOpen && remaining > 0) {
      // Give the page a beat to settle before celebrating.
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [props.autoOpen, remaining]);

  if (remaining === 0) return null;

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 space-y-3"
      style={{ background: "linear-gradient(135deg, #f8f4ec 0%, #fdf9f0 100%)", borderColor: "#e8dcc8" }}
    >
      <div className="space-y-1">
        <p className="font-heading font-semibold" style={{ color: "var(--foreground)" }}>
          {props.memberCount} of {threshold} members — invite {remaining} more to go live
        </p>
        <p className="text-sm text-muted-foreground">
          Your community stays private until it reaches {threshold} members. Recruit your first {threshold - 1} and it becomes browsable to everyone.
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#e8dcc8" }} aria-hidden>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "var(--primary)" }}
        />
      </div>

      <Button onClick={() => setOpen(true)} className="w-full gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Invite {remaining} to go live
      </Button>

      <ShareModal core={props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
