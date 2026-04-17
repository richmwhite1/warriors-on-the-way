import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Privacy Policy — Warriors on the Way",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-heading font-semibold text-lg tracking-tight">
          Warriors on the Way
        </Link>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Sign in
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Legal</p>
          <h1 className="text-4xl font-heading font-semibold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-foreground leading-relaxed">
          <p className="text-muted-foreground">
            This Privacy Policy is being finalized. Full policy will be published shortly.
            Warriors on the Way takes the privacy of its members seriously. We collect
            only what we need to operate the platform and connect you with your community.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">What we collect</h2>
            <p className="text-muted-foreground">
              We collect your email address (or Google account information) when you sign
              in, and any profile information you choose to provide — display name, bio,
              avatar, and timezone. We also store posts, comments, and event RSVPs that
              you create on the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">How we use it</h2>
            <p className="text-muted-foreground">
              Your information is used solely to operate the Warriors on the Way platform:
              to authenticate you, show your profile to fellow community members, and
              deliver notifications about community activity. We do not sell your data
              or share it with third parties for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Third-party services</h2>
            <p className="text-muted-foreground">
              We use Supabase for authentication and data storage, Cloudinary for image
              hosting, and optionally Telegram for community group chat. Each of these
              services has its own privacy policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Your rights</h2>
            <p className="text-muted-foreground">
              You may request deletion of your account and associated data at any time
              by contacting a community administrator or reaching out through your local
              community page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              For privacy questions, contact the Warriors on the Way community through
              your local community page.
            </p>
          </section>
        </div>

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </div>

      <footer className="border-t py-6 px-6 text-center text-xs text-muted-foreground mt-auto">
        <p>
          Warriors on the Way &middot;{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">Terms</Link>
          {" "}&middot;{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>
        </p>
      </footer>
    </main>
  );
}
