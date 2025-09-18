import { generateId } from "@tweetapus/shared";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

export const rateLimitMiddleware = new Elysia().use(
  rateLimit({
    duration: 10_000, // 10 seconds
    max: 30,
    scoping: "scoped",
    generator: () => generateId(),
  })
);
