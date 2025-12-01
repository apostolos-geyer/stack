# @_/api.http

Hono webhook factory for HTTP endpoints.

## Purpose

Create webhook handlers for external services (Stripe, etc.) using the Hono framework.

## Exports

```typescript
import { createWebhook } from '@_/api.http';
```

## Usage

```typescript
// Create a webhook handler
export const stripeWebhook = createWebhook({
  basePath: '/api/webhooks/stripe',
  handler: async (c) => {
    const body = await c.req.text();
    // Verify and process webhook
    return c.json({ received: true });
  },
});
```

Mount in Next.js via route handler.

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for patterns
