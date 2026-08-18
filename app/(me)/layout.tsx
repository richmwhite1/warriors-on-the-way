import { BottomNav } from "@/components/bottom-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="sm:hidden" style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} aria-hidden />
      <BottomNav />
      <PwaInstallPrompt />
    </>
  );
}
