"use client";

import { useActionState } from "react";
import { signUpForNeed, type SignupState } from "@/lib/actions/needs";

// The smaller yes on an empty doorway.
//
// Someone who opens "I Need Support" and finds nothing behind it has just told us
// exactly what they need, at the moment they most need it. The only exit used to be
// "start a circle yourself" — the right ambition, and a very large ask of a person who
// came here because life feels heavy. Most people bounce, and we never learn they came.
//
// So: keep the founding ask, but put a one-tap alternative beside it. The email field
// only appears for guests, because a sign-in wall here filters out precisely the people
// the network exists for.
export function NeedSignupForm({
  needId,
  needSlug,
  signedIn,
}: {
  needId: string;
  needSlug: string;
  signedIn: boolean;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUpForNeed, null);

  if (state?.ok) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="font-sans text-sm leading-relaxed text-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-2.5">
      <input type="hidden" name="need_id" value={needId} />
      <input type="hidden" name="need_slug" value={needSlug} />

      <div className="grid gap-2 sm:grid-cols-2">
        {!signedIn && (
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            aria-label="Your email"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-sans text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        <input
          type="text"
          name="area"
          placeholder="Where are you? (e.g. Park City)"
          aria-label="Your area"
          className={`w-full rounded-xl border border-border bg-background px-3 py-2.5 font-sans text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            signedIn ? "sm:col-span-2" : ""
          }`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="press-scale w-full min-h-11 rounded-full border border-border bg-card px-5 py-2.5 font-heading text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        {pending ? "Saving…" : "Tell me when something opens here"}
      </button>

      {state && !state.ok && (
        <p role="alert" className="font-sans text-[13px] text-destructive">
          {state.message}
        </p>
      )}
      <p className="font-sans text-xs leading-relaxed text-muted-foreground">
        We&rsquo;ll only use this to tell you when something opens. Nobody else sees it.
      </p>
    </form>
  );
}
