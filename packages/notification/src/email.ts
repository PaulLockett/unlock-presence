import { Resend } from "resend";

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email via Resend SDK.
 * Used for async notifications (task digest, weekly reports).
 * Gracefully degrades if RESEND_API_KEY is not configured — logs and returns queued: false.
 */
export async function sendEmail(input: EmailInput): Promise<{ queued: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      JSON.stringify({
        level: "warn",
        msg: "RESEND_API_KEY not configured, skipping email",
        to: input.to,
        subject: input.subject,
      }),
    );
    return { queued: false };
  }

  const resend = new Resend(apiKey);
  const from = input.from ?? "Presence OS <notifications@presence-os.com>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    console.log(
      JSON.stringify({
        level: "error",
        msg: "Failed to send email",
        error: error.message,
        to: input.to,
      }),
    );
    return { queued: false };
  }

  return { queued: true };
}
