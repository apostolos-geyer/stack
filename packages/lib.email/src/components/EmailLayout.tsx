import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Img,
} from "@react-email/components";
import {
  EMAIL_BODY_BACKGROUND,
  EMAIL_CONTAINER_BACKGROUND,
  EMAIL_FONT_FAMILY,
  EMAIL_MAX_WIDTH,
  PRIMARY_COLOR,
} from "../constants";

export interface EmailLayoutProps {
  title?: string;
  previewText?: string;
  logoUrl?: string;
  logoAlt?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  title,
  previewText,
  logoUrl,
  logoAlt = "Logo",
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>{title && <title>{title}</title>}</Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: EMAIL_BODY_BACKGROUND,
          fontFamily: EMAIL_FONT_FAMILY,
          padding: "20px 0",
          margin: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: EMAIL_CONTAINER_BACKGROUND,
            maxWidth: EMAIL_MAX_WIDTH,
            margin: "0 auto",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {logoUrl && (
            <Section
              style={{
                backgroundColor: PRIMARY_COLOR,
                padding: "24px",
                textAlign: "center",
              }}
            >
              <Img
                src={logoUrl}
                alt={logoAlt}
                height={40}
                style={{
                  display: "inline-block",
                  margin: "0 auto",
                }}
              />
            </Section>
          )}
          <Section style={{ padding: "40px 32px" }}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;
