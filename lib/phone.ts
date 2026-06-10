/**
 * SMS is feature-gated on Twilio configuration. When the env vars are absent,
 * all SMS UI (phone fields, consent checkboxes, organizer blast) is hidden and
 * server SMS paths are skipped — the product must never promise texts it
 * cannot send. Server-only: env vars are not available in client components.
 */
export function smsEnabled(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Normalize a phone string to E.164 format.
 * Returns null if the input is not a recognizable phone number.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+") && digits.length >= 10 && digits.length <= 15)
    return `+${digits}`;
  return null;
}
