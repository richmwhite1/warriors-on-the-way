"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshInviteToken, revokeInviteToken } from "@/lib/actions/communities";
import { toast } from "sonner";

type Props = {
  communityId: string;
  communitySlug: string;
  currentToken: string | null;
  siteUrl: string;
};

export function InviteLink({ communityId, communitySlug, currentToken, siteUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const inviteUrl = currentToken
    ? `${siteUrl}/community/${communitySlug}?invite=${currentToken}`
    : null;

  function handleGenerate() {
    startTransition(async () => {
      try {
        const token = await refreshInviteToken(communityId, communitySlug);
        const url = `${siteUrl}/community/${communitySlug}?invite=${token}`;
        await navigator.clipboard.writeText(url);
        toast.success("Invite link generated and copied");
      } catch { toast.error("Failed to generate invite link"); }
    });
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Copied to clipboard");
  }

  function handleRevoke() {
    startTransition(async () => {
      try {
        await revokeInviteToken(communityId, communitySlug);
        toast.success("Invite link revoked");
      } catch { toast.error("Failed to revoke invite link"); }
    });
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Invite link</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Anyone with this link can join, bypassing the approval queue.
        </p>
      </div>

      {inviteUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <code className="text-xs flex-1 truncate text-muted-foreground">{inviteUrl}</code>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} disabled={isPending}>
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isPending}>
              Regenerate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              Revoke
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={handleGenerate} disabled={isPending}>
          Generate invite link
        </Button>
      )}
    </div>
  );
}
