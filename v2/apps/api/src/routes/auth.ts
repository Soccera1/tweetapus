import { jwt } from "@elysiajs/jwt";
import { createUser, getUserByUsername } from "@tweetapus/database";
import { generateId } from "@tweetapus/shared";
import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authRouter = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))

  .get("/check-username/:username", async ({ params }) => {
    const user = await getUserByUsername(params.username);
    return { available: !user };
  })

  .post(
    "/register",
    async ({ body, jwt }) => {
      const { username, name } = body;

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return { error: "Username already taken" };
      }

      try {
        const user = await createUser({
          id: generateId(),
          username,
          name,
          verified: false,
          admin: false,
          suspended: false,
          private: false,
          postCount: 0,
          followerCount: 0,
          followingCount: 0,
        });

        const token = await jwt.sign({
          userId: user.id,
          username: user.username,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        });

        return { success: true, token, user };
      } catch (error) {
        console.error("Registration error:", error);
        return { error: "Registration failed" };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1, maxLength: 50 }),
        name: t.String({ minLength: 1, maxLength: 50 }),
      }),
    }
  )

  .post(
    "/login",
    async ({ body, jwt }) => {
      const { username } = body;

      const user = await getUserByUsername(username);
      if (!user) {
        return { error: "User not found" };
      }

      try {
        const token = await jwt.sign({
          userId: user.id,
          username: user.username,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        });

        return { success: true, token, user };
      } catch (error) {
        console.error("Login error:", error);
        return { error: "Login failed" };
      }
    },
    {
      body: t.Object({
        username: t.String(),
      }),
    }
  )

  .use(authMiddleware)
  .get("/me", ({ user }) => {
    if (!user) {
      return { error: "Not authenticated" };
    }
    return { user };
  })

  .post("/logout", () => {
    return { success: true };
  });
