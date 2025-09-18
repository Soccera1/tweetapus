import { searchPosts, searchUsers } from "@tweetapus/database";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";

export const searchRouter = new Elysia({ prefix: "/search" })
  .use(requireAuth)

  .get(
    "/users",
    async ({ query }) => {
      const q = query.q as string;
      const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));

      if (!q || q.trim().length < 2) {
        return { users: [] };
      }

      const users = await searchUsers(q.trim(), limit);

      return {
        users: users.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.name,
          bio: user.bio,
          verified: user.verified,
          avatar: user.avatar,
          followersCount: user.followersCount,
        })),
      };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1 }),
        limit: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/posts",
    async ({ query }) => {
      const q = query.q as string;
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));

      if (!q || q.trim().length < 2) {
        return { posts: [] };
      }

      const posts = await searchPosts(q.trim(), limit);

      return { posts };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1 }),
        limit: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/",
    async ({ query }) => {
      const q = query.q as string;
      const type = (query.type as string) || "all";
      const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));

      if (!q || q.trim().length < 2) {
        return { users: [], posts: [] };
      }

      const searchTerm = q.trim();

      let users: Awaited<ReturnType<typeof searchUsers>> = [];
      let posts: Awaited<ReturnType<typeof searchPosts>> = [];
      if (type === "all" || type === "users") {
        users = await searchUsers(searchTerm, limit);
      }

      if (type === "all" || type === "posts") {
        posts = await searchPosts(searchTerm, limit);
      }

      return {
        users: users.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.name,
          bio: user.bio,
          verified: user.verified,
          avatar: user.avatar,
          followersCount: user.followersCount,
        })),
        posts,
      };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1 }),
        type: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  );
