import { BottomNav } from "@/components/bottom-nav";

// No auth gate on purpose: doorways and offerings are the surfaces a newcomer is
// handed a link to. They read fine signed-out, and AppNav offers sign-in.
export default function OfferingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="sm:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} aria-hidden />
      <BottomNav />
    </>
  );
}
