import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-5xl sm:text-6xl font-heading font-semibold leading-tight text-foreground">
            Warriors on the Way
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A gathering place for devotional non-duality. Small, intimate
            communities — hikes, retreats, sound baths, dinners — walked
            together.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
          >
            Join the path
          </Link>
          <Link
            href="/about"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full px-8"
            )}
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-6 text-center text-xs text-muted-foreground">
        <p>
          Warriors on the Way &middot;{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>{" "}
          &middot;{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
      </footer>
    </main>
  );
}
