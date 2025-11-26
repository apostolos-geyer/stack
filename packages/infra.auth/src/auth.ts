import { serverEnv } from "@_/platform/server";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@_/infra.db";
import {
  sendEmail,
  render,
  ResetPasswordEmail,
  VerificationEmail,
} from "@_/lib.email";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY!);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const html = await render(
        ResetPasswordEmail({
          name: user.name,
          url,
        }),
      );
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const html = await render(
        VerificationEmail({
          name: user.name,
          url,
        }),
      );
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html,
      });
    },
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: serverEnv.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
    }),
    expo(),
    nextCookies(),
  ],
  trustedOrigins: [
    ...(serverEnv.NODE_ENV === "development"
      ? [
          "exp://*/*", // Trust all Expo development URLs
          "exp://10.0.0.*:*/*", // Trust 10.0.0.x IP range
          "exp://192.168.*.*:*/*", // Trust 192.168.x.x IP range
          "exp://172.*.*.*:*/*", // Trust 172.x.x.x IP range
          "exp://localhost:*/*", // Trust localhost
        ]
      : []),
  ],
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
