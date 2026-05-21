/**
 * A card-reveal entrance animation for the guest invitation experience.
 *
 * Uses a pure CSS animation so the content is ALWAYS visible — even if
 * JavaScript fails to load or hydrate. The animation is progressive
 * enhancement only; the content itself never depends on JS.
 */
export function InvitationReveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-invite-reveal">
      {children}
    </div>
  );
}
