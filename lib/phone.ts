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
