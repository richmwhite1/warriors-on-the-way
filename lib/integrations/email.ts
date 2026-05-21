import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "Warriors on the Way <hello@warriorsontheway.com>";

export async function sendEventReminder({
  to,
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  eventUrl,
}: {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  eventUrl: string;
}) {
  const locationLine = location ? `<p style="margin:0 0 4px;color:#666;">📍 ${location}</p>` : "";

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${eventTitle} is tomorrow`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 0;">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#a07828;">Warriors on the Way</p>
        <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;line-height:1.2;">${eventTitle}</h1>

        <div style="background:#f8f7f5;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-weight:600;">${eventDate}</p>
          <p style="margin:0 0 4px;color:#666;">${eventTime}</p>
          ${locationLine}
        </div>

        <p style="margin:0 0 20px;color:#444;line-height:1.5;">
          Hey ${guestName}, just a friendly reminder that this event is tomorrow. We're looking forward to seeing you!
        </p>

        <a href="${eventUrl}" style="display:inline-block;background:#1a1610;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          View event details
        </a>

        <p style="margin:32px 0 0;font-size:12px;color:#999;">
          You received this because you RSVP'd to this event.
        </p>
      </div>
    `,
  });
}
