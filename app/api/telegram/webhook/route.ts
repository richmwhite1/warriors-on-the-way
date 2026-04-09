import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/integrations/telegram";

// UUID v4 pattern
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // Validate the Telegram secret token (set when registering the webhook)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const incoming = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (incoming !== secret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  let update: Record<string, unknown>;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // ── Handle /start COMMUNITY_UUID in a group chat ─────────────────────────
  // Telegram fires this when an organizer uses the deep link:
  //   tg://resolve?domain=BOT_USERNAME&startgroup=COMMUNITY_ID
  // The bot receives /start <COMMUNITY_ID> in the group so we can match exactly.
  const msg = update.message as
    | { text?: string; chat: { id: number; type: string; title?: string } }
    | undefined;

  if (msg?.text && msg.chat.type !== "private") {
    // Matches "/start UUID" or "/start@BotName UUID"
    const match = msg.text.match(/^\/start(?:@\w+)?\s+(\S+)$/i);
    const communityId = match?.[1];

    if (communityId && UUID_RE.test(communityId)) {
      const chatId = String(msg.chat.id);
      const chatTitle = msg.chat.title ?? "Telegram Group";

      const admin = createAdminClient();
      const { error } = await admin
        .from("communities")
        .update({ telegram_chat_id: chatId })
        .eq("id", communityId);

      if (!error) {
        await sendMessage(
          chatId,
          `✅ <b>Connected!</b>\n\nThis group is now linked to your Warriors on the Way community. New posts and events will appear here automatically.`
        ).catch(() => {
          // Don't fail the webhook if the welcome message fails
        });
      }

      console.log(
        `[telegram-webhook] Community ${communityId} → chat ${chatId} (${chatTitle}) — error: ${error?.message ?? "none"}`
      );
    }
  }

  // Telegram expects a 200 OK within 1s or it retries
  return NextResponse.json({ ok: true });
}
