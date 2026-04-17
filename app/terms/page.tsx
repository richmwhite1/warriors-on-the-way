import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Terms of Use — Warriors on the Way",
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-heading font-semibold">Terms of Use</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-foreground leading-relaxed">
          <p className="text-muted-foreground">
            These Terms of Use are being finalized. Full terms will be published shortly.
            By using Warriors on the Way, you agree to participate in good faith, treat
            fellow members with respect, and uphold the values expressed in the
            Lightworkers Manifesto.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Community Standards</h2>
            <p className="text-muted-foreground">
              Warriors on the Way communities are spaces for sincere engagement with the
              spiritual and social mission outlined by our Spiritual Director, Fr. Seán
              Ó'Laoire. Members are expected to engage with honesty, care, and respect
              for the dignity of all people.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Membership</h2>
            <p className="text-muted-foreground">
              Each local community is capped at 150 members to maintain the depth of
              relationship that makes genuine transformation possible. Community admins
              may remove members who violate community standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact the Warriors on the Way community
              through your local community page.
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
