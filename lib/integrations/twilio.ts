import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
  }
  return _client;
}

const FROM = () => process.env.TWILIO_PHONE_NUMBER!;

export async function sendSms(to: string, body: string): Promise<void> {
  await getClient().messages.create({ to, from: FROM(), body });
}

export async function sendEventReminderSms({
  to,
  name,
  eventTitle,
  eventDate,
  eventTime,
  location,
  eventUrl,
}: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  eventUrl: string;
}) {
  const loc = location ? ` at ${location}` : "";
  const body = `Hey ${name}! Reminder: ${eventTitle} is ${eventDate} ${eventTime}${loc}. Details: ${eventUrl}`;
  await sendSms(to, body);
}
