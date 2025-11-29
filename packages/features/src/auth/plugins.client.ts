import { usernameClient, adminClient } from "better-auth/client/plugins";

import { stripeClient } from "@better-auth/stripe/client";

export default [
  usernameClient(),
  adminClient(),
  stripeClient({ subscription: true }),
];
