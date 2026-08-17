import { redirect } from "next/navigation";

// The authenticated home is now the objective Deck. Kept as a redirect so existing
// links to /home (AppNav wordmark, deep links) land on the new surface.
export default function HomePage() {
  redirect("/deck");
}
