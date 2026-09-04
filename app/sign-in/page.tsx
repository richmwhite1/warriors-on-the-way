import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";
import { smsEnabled } from "@/lib/phone";

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
            className="text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "#D4AF37" }}
          >
            Another name for lightworkers
          </p>
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{
              fontFamily: "var(--font-brand)",
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
            <SignInForm smsEnabled={smsEnabled()} />
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
