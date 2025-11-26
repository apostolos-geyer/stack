import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";

export type Configuration = {
  basePath: `/${string}`;
  message: string;
};
export const create = ({ basePath, message }: Configuration) =>
  new Hono()
    .basePath(basePath)
    .use(logger())
    .post("/", async (c) => c.text(message));
