// n8n integration — single function that fires all outbound webhooks.
// Phase 4 wires this up to real n8n workflows.
// For now it's a no-op placeholder so actions can already import it.

type WebhookEvent =
  | "event.created"
  | "event.updated"
  | "event.cancelled"
  | "post.created"
  | "rsvp.reminder"
  | "waitlist.spot_opened"
  | "community.reported";

export async function fireWebhook(
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const base = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  // Phase 0–3: silently skip if n8n isn't configured yet
  if (!base || !secret) return;

  await fetch(`${base}/${event}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(payload),
  });
}
