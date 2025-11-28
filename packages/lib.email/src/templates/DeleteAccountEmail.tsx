import { Button, Heading, Text, Hr } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";

export interface DeleteAccountEmailProps {
  name?: string;
  url: string;
  logoUrl?: string;
}

export function DeleteAccountEmail({
  name,
  url,
  logoUrl,
}: DeleteAccountEmailProps) {
  return (
    <EmailLayout
      title="Confirm account deletion"
      previewText="Please confirm that you want to delete your account."
      logoUrl={logoUrl}
    >
      <Heading
        as="h1"
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#dc2626",
          margin: "0 0 24px",
        }}
      >
        Confirm account deletion
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
        You requested to delete your account. This action is{" "}
        <strong>permanent and cannot be undone</strong>. All your data will be
        permanently removed from our servers.
      </Text>

      <Text
        style={{
          fontSize: "16px",
          lineHeight: "26px",
          color: "#4a4a4a",
          margin: "0 0 24px",
        }}
      >
        If you are sure you want to proceed, click the button below.
      </Text>

      <Button
        href={url}
        style={{
          backgroundColor: "#dc2626",
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
        Delete My Account
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
        If you didn&apos;t request account deletion, please ignore this email
        and consider changing your password for security.
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

export default DeleteAccountEmail;
