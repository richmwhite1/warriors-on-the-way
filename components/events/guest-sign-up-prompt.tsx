"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { toast } from "sonner";

type Props = {
  /** The URL to redirect to after the magic link is clicked */
  next: string;
};

export function GuestSignUpPrompt({ next }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      try {
        await signInWithMagicLink(email.trim(), next);
        setSent(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-1.5">
        <p className="font-medium text-sm">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
          Click it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">Want the full experience?</p>
        <p className="text-sm text-muted-foreground">
          Enter your email to create a free account — no password needed.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          maxLength={200}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending || !email.trim()} className="shrink-0">
          {isPending ? "Sending…" : "Send link"}
        </Button>
      </div>
    </form>
  );
}
