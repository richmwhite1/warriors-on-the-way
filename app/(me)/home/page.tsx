import { redirect } from "next/navigation";

// The authenticated home is now the six-need Menu (Shannon's front door). Kept as a
// redirect so existing links to /home (AppNav wordmark, deep links) land on it.
export default function HomePage() {
  redirect("/menu");
}
