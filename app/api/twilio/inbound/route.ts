import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";

// Twilio Messaging inbound webhook. Carriers already block delivery after a
// STOP, but without this our DB still thinks the person is opted in and we
// keep attempting (and paying for) sends — and we'd have no opt-out record.
// Configure in Twilio: Phone Number → Messaging → "A message comes in" →
// POST {SITE_URL}/api/twilio/inbound

const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_WORDS = new Set(["START", "YES", "UNSTOP"]);

const EMPTY_TWIML = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

function twimlResponse() {
  return new NextResponse(EMPTY_TWIML, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });

  // Validate the request really came from Twilio
  const signature = request.headers.get("X-Twilio-Signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/twilio/inbound`;
  if (!twilio.validateRequest(authToken, signature, url, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params.From;
  const keyword = (params.Body ?? "").trim().toUpperCase();
  if (!from) return twimlResponse();

  const admin = createAdminClient();

  if (STOP_WORDS.has(keyword)) {
    await Promise.allSettled([
      admin.from("users").update({ notify_sms: false }).eq("phone", from),
      admin.from("guest_rsvps").update({ notify_sms: false }).eq("phone", from),
    ]);
  } else if (START_WORDS.has(keyword)) {
    const consentAt = new Date().toISOString();
    await Promise.allSettled([
      admin
        .from("users")
        .update({ notify_sms: true, sms_consent_at: consentAt, sms_consent_source: "sms_start_keyword" })
        .eq("phone", from),
      admin
        .from("guest_rsvps")
        .update({ notify_sms: true, sms_consent_at: consentAt })
        .eq("phone", from),
    ]);
  }

  // Empty TwiML — Twilio's standard opt-out flow sends the confirmation reply
  return twimlResponse();
}
