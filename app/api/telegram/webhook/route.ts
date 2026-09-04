import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/integrations/telegram";

// UUID v4 pattern
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // Validate the Telegram secret token (set when registering the webhook)
  // Fail closed: if the secret is not configured, reject all requests
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let update: Record<string, unknown>;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // ── Handle /start LINK_TOKEN in a group chat ─────────────────────────────
  // Telegram fires this when a steward uses the deep link:
  //   tg://resolve?domain=BOT_USERNAME&startgroup=LINK_TOKEN
  //
  // The argument is communities.telegram_link_token, not the community id. The id is
  // readable with the anon key, so anyone could have pointed any community's posts and
  // events at a group chat of their own; the link token is a steward-only secret, so
  // holding it is what proves the sender is entitled to connect the group.
  const msg = update.message as
    | { text?: string; chat: { id: number; type: string; title?: string } }
    | undefined;

  if (msg?.text && msg.chat.type !== "private") {
    // Matches "/start UUID" or "/start@BotName UUID"
    const match = msg.text.match(/^\/start(?:@\w+)?\s+(\S+)$/i);
    const linkToken = match?.[1];

    if (linkToken && UUID_RE.test(linkToken)) {
      const chatId = String(msg.chat.id);
      const chatTitle = msg.chat.title ?? "Telegram Group";

      const admin = createAdminClient();
      // .select() so a token that matches nothing is distinguishable from a
      // successful link — an UPDATE affecting zero rows is not an error.
      const { data: linked, error } = await admin
        .from("communities")
        .update({ telegram_chat_id: chatId })
        .eq("telegram_link_token", linkToken)
        .select("id")
        .maybeSingle();

      if (!error && linked) {
        await sendMessage(
          chatId,
          `✅ <b>Connected!</b>\n\nThis group is now linked to your Warriors on the Way community. New posts and events will appear here automatically.`
        ).catch(() => {
          // Don't fail the webhook if the welcome message fails
        });
      }

      console.log(
        `[telegram-webhook] link token → community ${linked?.id ?? "no match"} → chat ${chatId} (${chatTitle}) — error: ${error?.message ?? "none"}`
      );
    }
  }

  // Telegram expects a 200 OK within 1s or it retries
  return NextResponse.json({ ok: true });
}
