import { serverEnv } from "@_/platform/server";
import { Resend } from "resend";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  const resend = new Resend(serverEnv.RESEND_API_KEY);
  const from = serverEnv.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  // In development, redirect all emails to Resend's test inbox
  const recipient =
    serverEnv.NODE_ENV === "development"
      ? `delivered+${to.replace("@", ".")}@resend.dev`
      : to;

  await resend.emails.send({
    from,
    to: recipient,
    subject,
    html,
  });
}
