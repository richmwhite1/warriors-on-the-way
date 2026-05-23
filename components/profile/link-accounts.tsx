"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { linkGoogleAccount } from "@/lib/actions/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";

type Identity = { provider: string };

export function LinkAccounts({
  identities,
  phone,
}: {
  identities: Identity[];
  phone: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const providers = new Set(identities.map((i) => i.provider));

  const hasGoogle = providers.has("google");
  const hasPhone = !!phone;

  // If user has all providers linked, don't show anything
  if (hasGoogle && hasPhone) return null;

  function handleLinkGoogle() {
    startTransition(async () => {
      try {
        await linkGoogleAccount();
      } catch (err) {
        if (isRedirectError(err)) throw err;
        toast.error("Failed to link Google account. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Linked accounts</p>

      <div className="space-y-2">
        {hasGoogle && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-green-600">&#10003;</span> Google
          </div>
        )}
        {hasPhone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-green-600">&#10003;</span> Phone ({phone})
          </div>
        )}

        {!hasGoogle && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLinkGoogle}
            disabled={isPending}
          >
            {isPending ? "Linking…" : "Link Google account"}
          </Button>
        )}

        {!hasPhone && (
          <p className="text-xs text-muted-foreground">
            Add a phone number above to link phone sign-in.
          </p>
        )}
      </div>
    </div>
  );
}
