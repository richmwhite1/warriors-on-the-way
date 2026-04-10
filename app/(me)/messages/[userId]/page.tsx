import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationFeed } from "@/components/messages/conversation-feed";
import { requireUserProfile, getUserProfile } from "@/lib/queries/users";
import { listMessages } from "@/lib/queries/messages";
import { markConversationRead } from "@/lib/actions/messages";

type Props = { params: Promise<{ userId: string }> };

export default async function ConversationPage({ params }: Props) {
  const { userId } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/messages/${userId}`);

  if (userId === user.id) redirect("/messages");

  const [other, messages] = await Promise.all([
    getUserProfile(userId),
    listMessages(user.id, userId),
  ]);

  if (!other) notFound();

  await markConversationRead(userId);

  const initials = other.display_name.slice(0, 2).toUpperCase();

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
          <Link href="/messages" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            ←
          </Link>
          <Link href={`/profile/${other.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar size="sm">
              {other.avatar_url && <AvatarImage src={other.avatar_url} alt={other.display_name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{other.display_name}</span>
          </Link>
        </div>

        {/* Realtime feed + input */}
        <ConversationFeed
          initialMessages={messages}
          currentUserId={user.id}
          recipientId={other.id}
          recipientName={other.display_name}
        />
      </main>
    </>
  );
}
