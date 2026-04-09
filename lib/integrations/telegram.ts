/**
 * Telegram Bot API helpers.
 * Env vars required: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
 */

function apiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return `https://api.telegram.org/bot${token}/${method}`;
}

type TelegramUpdate = {
  update_id: number;
  my_chat_member?: {
    chat: { id: number; title: string; type: string };
    new_chat_member: { status: string };
  };
  message?: {
    text?: string;
    chat: { id: number; title?: string; type: string };
  };
};

/**
 * Detects which group the bot was just added to.
 *
 * When an organizer uses the `tg://resolve?domain=BOT&startgroup=COMMUNITY_ID`
 * deep link, Telegram adds the bot to their chosen group and fires a
 * `/start COMMUNITY_ID` message there. We use that to pinpoint exactly which
 * chat belongs to which community — no guessing.
 *
 * Falls back to the most recent `my_chat_member` join event if no `/start`
 * message is found (e.g., organizer added the bot manually).
 */
export async function detectNewGroupChatId(
  communityId: string
): Promise<{ chatId: string; chatTitle: string } | null> {
  // Request both update types: join events + messages (for the /start payload)
  const qs = "?limit=100&allowed_updates=%5B%22my_chat_member%22%2C%22message%22%5D";
  const res = await fetch(apiUrl("getUpdates") + qs);
  if (!res.ok) throw new Error("Telegram API error: " + res.statusText);
  const json = await res.json() as { ok: boolean; result: TelegramUpdate[] };
  if (!json.ok) throw new Error("Telegram getUpdates failed");

  const updates = json.result;

  // Primary: look for /start COMMUNITY_ID message sent in a group
  // Telegram sends this automatically when an organizer uses the ?startgroup=PAYLOAD deep link.
  const startMsg = [...updates].reverse().find(
    (u) =>
      u.message?.text?.includes(communityId) &&
      u.message.chat.type !== "private"
  );
  if (startMsg?.message) {
    return {
      chatId: String(startMsg.message.chat.id),
      chatTitle: startMsg.message.chat.title ?? "Your group",
    };
  }

  // Fallback: most recent group where the bot gained membership
  const joinEvent = [...updates].reverse().find(
    (u) =>
      u.my_chat_member &&
      (u.my_chat_member.chat.type === "group" ||
        u.my_chat_member.chat.type === "supergroup") &&
      (u.my_chat_member.new_chat_member.status === "member" ||
        u.my_chat_member.new_chat_member.status === "administrator")
  );
  if (joinEvent?.my_chat_member) {
    return {
      chatId: String(joinEvent.my_chat_member.chat.id),
      chatTitle: joinEvent.my_chat_member.chat.title,
    };
  }

  return null;
}

/**
 * Registers (or updates) the Telegram webhook URL with the Bot API.
 * Must be called from a server context. Requires NEXT_PUBLIC_SITE_URL and
 * optionally TELEGRAM_WEBHOOK_SECRET to authenticate incoming webhook calls.
 */
export async function registerWebhook(): Promise<{ ok: boolean; description?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not set — required to register webhook");

  const webhookUrl = `${siteUrl}/api/telegram/webhook`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message", "my_chat_member"],
    drop_pending_updates: false,
  };
  if (secret) body.secret_token = secret;

  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json() as Promise<{ ok: boolean; description?: string }>;
}

export async function sendMessage(chatId: string, text: string): Promise<void> {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { description?: string }).description ?? "Telegram sendMessage failed"
    );
  }
}

/** Post a new-post notification to a connected Telegram group. */
export async function sendPostNotification(
  chatId: string,
  opts: {
    communityName: string;
    authorName: string;
    body: string;
    postType: string;
  }
): Promise<void> {
  const typeEmoji: Record<string, string> = {
    question: "❓",
    quote: "💬",
    checkin: "✅",
    recommendation: "⭐",
    general: "📝",
  };
  const emoji = typeEmoji[opts.postType] ?? "📝";
  const preview = opts.body.length > 280 ? opts.body.slice(0, 277) + "…" : opts.body;
  await sendMessage(
    chatId,
    `${emoji} <b>${opts.communityName}</b>\n\n${preview}\n\n— ${opts.authorName}`
  );
}

/** Post a new-event notification to a connected Telegram group. */
export async function sendEventNotification(
  chatId: string,
  opts: {
    communityName: string;
    title: string;
    location: string | null;
    startsAt: string | null;
    timezone: string;
  }
): Promise<void> {
  const dateStr = opts.startsAt
    ? new Date(opts.startsAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: opts.timezone,
      })
    : "Date TBD";
  const loc = opts.location ? `\n📍 ${opts.location}` : "";
  await sendMessage(
    chatId,
    `📅 New event in <b>${opts.communityName}</b>\n\n<b>${opts.title}</b>\n🗓 ${dateStr}${loc}`
  );
}
