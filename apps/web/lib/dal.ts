"use server";

import { cache } from "react";
import { auth } from "@_/infra.auth";
import { headers } from "next/headers";

/**
 * only fire once per request.
 */
export const getSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
);
