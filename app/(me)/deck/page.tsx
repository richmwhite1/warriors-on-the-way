import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ mode?: string }> };

// The Deck is gone — the Menu (six felt needs) is the front door now, and the nine
// missions live on at /topics. A Deck link carrying ?mode=<topic-slug> was pointing at
// one mission's feed, so send it to that mission rather than dumping everyone on /menu.
export default async function DeckPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  redirect(mode ? `/topics/${mode}` : "/menu");
}
