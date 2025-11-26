import { Button, Heading, Text, Hr } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { PRIMARY_COLOR } from "../constants";

export interface ResetPasswordEmailProps {
  name?: string;
  url: string;
  logoUrl?: string;
}

export function ResetPasswordEmail({
  name,
  url,
  logoUrl,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      title="Reset your password"
      previewText="You requested to reset your password. Click the link to continue."
      logoUrl={logoUrl}
    >
      <Heading
        as="h1"
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#1a1a1a",
          margin: "0 0 24px",
        }}
      >
        Reset your password
      </Heading>

      <Text
        style={{
          fontSize: "16px",
          lineHeight: "26px",
          color: "#4a4a4a",
          margin: "0 0 16px",
        }}
      >
        {name ? `Hi ${name},` : "Hi,"}
      </Text>

      <Text
        style={{
          fontSize: "16px",
          lineHeight: "26px",
          color: "#4a4a4a",
          margin: "0 0 24px",
        }}
      >
        We received a request to reset your password. Click the button below to
        choose a new password.
      </Text>

      <Button
        href={url}
        style={{
          backgroundColor: PRIMARY_COLOR,
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "600",
          textDecoration: "none",
          textAlign: "center",
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: "6px",
        }}
      >
        Reset Password
      </Button>

      <Hr
        style={{
          borderColor: "#e5e5e5",
          margin: "32px 0",
        }}
      />

      <Text
        style={{
          fontSize: "14px",
          lineHeight: "22px",
          color: "#6b6b6b",
          margin: "0",
        }}
      >
        If you didn&apos;t request a password reset, you can safely ignore this
        email. Your password will remain unchanged.
      </Text>

      <Text
        style={{
          fontSize: "12px",
          lineHeight: "20px",
          color: "#9a9a9a",
          margin: "16px 0 0",
        }}
      >
        If the button doesn&apos;t work, copy and paste this link into your
        browser: {url}
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
