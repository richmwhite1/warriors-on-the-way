import { BottomNav } from "@/components/bottom-nav";

export default async function SeanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="sm:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} aria-hidden />
      <BottomNav />
    </>
  );
}
