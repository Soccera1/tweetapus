import { jwt } from "@elysiajs/jwt";
import { getActiveSuspension, getUserById } from "@tweetapus/database";
import { Elysia } from "elysia";

// Cache for suspension checks to reduce DB queries
const suspensionCache = new Map<
  string,
  { suspension: unknown; expiry: number }
>();
const CACHE_TTL = 30_000; // 30 seconds

export const authMiddleware = new Elysia()
  .use(
    jwt({ name: "jwt", secret: process.env.JWT_SECRET || "your-secret-key" })
  )
  .derive(async ({ headers, jwt }) => {
    const authorization = headers.authorization;

    if (!authorization) return { user: null };

    try {
      const token = authorization.replace("Bearer ", "");
      const payload = (await jwt.verify(token)) as {
        userId: string;
        username: string;
      };

      if (!payload || !payload.userId) return { user: null };

      const user = await getUserById(payload.userId);
      return { user };
    } catch {
      return { user: null };
    }
  });

export const requireAuth = new Elysia().use(authMiddleware).guard({
  beforeHandle: ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Authentication required" };
    }
  },
});

export const suspensionMiddleware = new Elysia()
  .use(authMiddleware)
  .onBeforeHandle(async ({ user, set }) => {
    if (!user) return;

    const now = Date.now();
    let cached = suspensionCache.get(user.id);

    if (!cached || cached.expiry < now) {
      const suspension = await getActiveSuspension(user.id);
      cached = { suspension, expiry: now + CACHE_TTL };
      suspensionCache.set(user.id, cached);
    }

    if (cached.suspension) {
      set.status = 403;
      return { error: "You are suspended", suspension: cached.suspension };
    }
  });

export const requireAdmin = new Elysia().use(requireAuth).guard({
  beforeHandle: ({ user, set }) => {
    if (!user?.admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }
  },
});
