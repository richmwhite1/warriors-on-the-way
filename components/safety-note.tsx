// Trust and safety, said out loud at the point of commitment.
//
// This app asks people to meet strangers, in person, at real addresses, around subjects
// that leave them open. It already does several careful things — real names, 18+, gated
// addresses, reporting — and said none of them where the decision is actually made.
//
// It deliberately does NOT claim organizers are vetted, because they are not: anyone can
// start a circle and it opens at five members. Answering "how are organizers vetted?"
// with a comfortable half-truth would be worse than the silence it replaces. The honest
// answer, plus what genuinely is in place, is what earns the trust.
//
// Collapsed by default: someone ready to join shouldn't have to read a policy first, and
// someone hesitating should find it without hunting.
export function SafetyNote({ context = "circle" }: { context?: "circle" | "event" }) {
  return (
    <details className="rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
      <summary className="cursor-pointer list-none text-[13px] font-medium text-muted-foreground marker:hidden">
        <span className="mr-1.5" aria-hidden>
          ⓘ
        </span>
        {context === "event"
          ? "Meeting people in person — what to expect"
          : "Is this safe? What we do, and what we don't"}
      </summary>

      <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
        <li>
          <strong className="font-semibold text-foreground">Real names only.</strong> Everyone
          here signs up with their real first name, last initial and a photo, and confirms
          they&rsquo;re 18 or older. There are no anonymous accounts.
        </li>
        <li>
          <strong className="font-semibold text-foreground">
            Circles are run by members, not staff.
          </strong>{" "}
          Anyone can start one, and nobody is background-checked. Treat a first meeting the
          way you&rsquo;d treat meeting anyone new — somewhere public, and tell a friend
          where you&rsquo;ll be.
        </li>
        <li>
          <strong className="font-semibold text-foreground">Addresses stay private</strong>{" "}
          until you say you&rsquo;re coming. Before that you only see the general area.
        </li>
        <li>
          <strong className="font-semibold text-foreground">You can report anything.</strong>{" "}
          Every post and every profile has a report option, and it reaches that
          circle&rsquo;s organizers. Leave whenever you want — nobody charges you, so
          there&rsquo;s nothing to cancel.
        </li>
      </ul>
    </details>
  );
}
