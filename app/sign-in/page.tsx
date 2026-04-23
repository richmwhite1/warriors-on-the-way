"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/actions/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Isolated so useSearchParams doesn't block the outer page from rendering
function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await signInWithMagicLink(email, next);
        setSent(true);
      } catch {
        toast.error("Couldn't send the link. Please try again.");
      }
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      try {
        await signInWithGoogle(next);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        toast.error("Google sign-in failed. Please try again.");
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center space-y-2">
        <p className="font-heading text-lg text-foreground">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          A sign-in link was sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
          <br />Click it to continue.
        </p>
        <button
          className="text-xs text-muted-foreground underline-offset-2 hover:underline mt-2"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-5">
      <Button variant="outline" className="w-full gap-2" onClick={handleGoogle} disabled={isPending}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleMagicLink} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending || !email}>
          {isPending ? "Sending…" : "Send sign-in link"}
        </Button>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main
      className="dark min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080604 0%, #100c08 50%, #0c0907 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 60%, #D4AF3712 0%, transparent 65%)" }}
      />

      <div className="relative w-full max-w-sm space-y-8">

        {/* Back link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest transition-colors"
          style={{ color: "#6b5e4e" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: "#D4AF37" }}
          >
            Another name for lightworkers
          </p>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display, var(--font-heading))",
              color: "#f0e8d8",
              textShadow: "0 2px 30px rgba(0,0,0,0.6)",
            }}
          >
            Warriors on the Way
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(to right, transparent, #D4AF3740)" }}
            />
            <p className="text-xs" style={{ color: "#5a4e3e" }}>
              Sign in to continue
            </p>
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(to left, transparent, #D4AF3740)" }}
            />
          </div>
        </div>

        {/* Form card — dark class forces shadcn dark-mode variants on inputs/buttons */}
        <div
          className="dark rounded-2xl p-6 space-y-5"
          style={{
            background: "#100e0b",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            }
          >
            <SignInForm />
          </Suspense>
        </div>

        <p className="text-center text-xs" style={{ color: "#3a3028" }}>
          By signing in you agree to our{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-stone-500 transition-colors">Terms</a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-stone-500 transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
