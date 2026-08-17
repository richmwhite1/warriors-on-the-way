import { BottomNav } from "@/components/bottom-nav";
import { requireUserProfile } from "@/lib/queries/users";

export default async function TopicsLayout({ children }: { children: React.ReactNode }) {
  // Ensures a profile exists; topic browsing/posting requires an account (real-name).
  await requireUserProfile().catch(() => null);
  return (
    <>
      {children}
      <div className="sm:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} aria-hidden />
      <BottomNav />
    </>
  );
}
