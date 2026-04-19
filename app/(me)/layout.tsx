import { BottomNav } from "@/components/bottom-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { requireUserProfile } from "@/lib/queries/users";
import { getUnreadDMCount } from "@/lib/queries/messages";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserProfile().catch(() => null);
  const unreadDMs = user ? await getUnreadDMCount(user.id) : 0;

  return (
    <>
      {children}
      <div className="sm:hidden" style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} aria-hidden />
      <BottomNav unreadDMs={unreadDMs} />
      <PwaInstallPrompt />
    </>
  );
}
