# @_/lib.email

Email templates with React Email and Resend.

## Purpose

Send transactional emails using React Email templates via the Resend API.

## Exports

```typescript
import { sendEmail } from '@_/lib.email';
import { WelcomeEmail } from '@_/lib.email/templates/welcome';
```

## Usage

```typescript
// Send an email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  react: <WelcomeEmail name="John" />,
});
```

## Adding Templates

Create templates in `src/templates/`:

```typescript
// src/templates/my-template.tsx
import { Html, Head, Body, Text } from '@react-email/components';

export function MyTemplate({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Hello {name}</Text>
      </Body>
    </Html>
  );
}
```

## Environment

Requires `RESEND_API_KEY` and `EMAIL_FROM` in env.
