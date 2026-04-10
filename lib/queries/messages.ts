import { createClient } from "@/lib/supabase/server";

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender: { id: string; display_name: string; avatar_url: string | null };
};

export type Conversation = {
  otherUser: { id: string; display_name: string; avatar_url: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  lastSenderId: string;
};

export async function getUnreadDMCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null)
      .is("deleted_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_messages")
    .select(`
      id, sender_id, recipient_id, body, read_at, created_at,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!data) return [];

  // Group by "other user", keep latest message per conversation
  const map = new Map<string, Conversation>();
  for (const row of data as unknown as (DirectMessage & { recipient: DirectMessage["sender"] })[]) {
    const isMe = row.sender_id === userId;
    const other = isMe ? row.recipient : row.sender;
    if (!other) continue;

    if (!map.has(other.id)) {
      const unreadCount = data.filter(
        (m) => (m as unknown as DirectMessage).sender_id === other.id &&
               (m as unknown as DirectMessage).recipient_id === userId &&
               (m as unknown as DirectMessage).read_at === null
      ).length;

      map.set(other.id, {
        otherUser: other,
        lastMessage: row.body,
        lastMessageAt: row.created_at,
        unreadCount,
        lastSenderId: row.sender_id,
      });
    }
  }

  return Array.from(map.values());
}

export async function listMessages(userId: string, otherUserId: string): Promise<DirectMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_messages")
    .select(`
      id, sender_id, recipient_id, body, read_at, created_at,
      sender:users!sender_id(id, display_name, avatar_url)
    `)
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  return (data as unknown as DirectMessage[]) ?? [];
}
