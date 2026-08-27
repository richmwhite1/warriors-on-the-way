import { SeanPortal } from "@/components/sean-portal";
import { ContemplativeNav } from "@/components/contemplative-nav";
import { fetchLatestChannelVideo } from "@/lib/integrations/youtube";

export const metadata = {
  title: "Seán Ó'Laoire · Spiritual Director",
  description:
    "Transmissions, chronicles, and live conversations with Warriors on the Way Spiritual Director Seán Ó'Laoire.",
};

export default async function SeanPage() {
  const latestVideo = await fetchLatestChannelVideo();

  return (
    <>
      <ContemplativeNav current="sean" />
      <SeanPortal latestVideo={latestVideo} />
    </>
  );
}
