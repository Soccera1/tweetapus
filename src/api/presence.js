import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import db from "./../db.js";
import ratelimit from "../helpers/ratelimit.js";

const JWT_SECRET = process.env.JWT_SECRET;

const getUserByUsername = db.query("SELECT * FROM users WHERE username = ?");

const updatePresence = db.query(`
  INSERT INTO user_presence (id, user_id, online, last_seen, device, ghost_mode)
  VALUES (?, ?, ?, datetime('now', 'utc'), ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    online = excluded.online,
    last_seen = datetime('now', 'utc'),
    device = excluded.device,
    ghost_mode = excluded.ghost_mode,
    updated_at = datetime('now', 'utc')
`);

const getPresence = db.query(`
  SELECT * FROM user_presence WHERE user_id = ?
`);

const updateGhostMode = db.query(`
  UPDATE user_presence SET ghost_mode = ?, updated_at = datetime('now', 'utc')
  WHERE user_id = ?
`);

export default new Elysia({ prefix: "/presence" })
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))
  .use(
    rateLimit({
      duration: 10_000,
      max: 100,
      scoping: "scoped",
      generator: ratelimit,
    })
  )
  .post("/update", async ({ jwt, headers, body }) => {
    const authorization = headers.authorization;
    if (!authorization) return { error: "Authentication required" };

    try {
      const payload = await jwt.verify(authorization.replace("Bearer ", ""));
      if (!payload) return { error: "Invalid token" };

      const user = getUserByUsername.get(payload.username);
      if (!user) return { error: "User not found" };

      const { online, device } = body;

      const presenceId = Bun.randomUUIDv7();
      const currentPresence = getPresence.get(user.id);
      const ghostMode = currentPresence?.ghost_mode || false;

      updatePresence.run(
        presenceId,
        user.id,
        online ? 1 : 0,
        device || null,
        ghostMode ? 1 : 0
      );

      return { success: true };
    } catch (error) {
      console.error("Update presence error:", error);
      return { error: "Failed to update presence" };
    }
  })
  .post("/ghost-mode", async ({ jwt, headers, body }) => {
    const authorization = headers.authorization;
    if (!authorization) return { error: "Authentication required" };

    try {
      const payload = await jwt.verify(authorization.replace("Bearer ", ""));
      if (!payload) return { error: "Invalid token" };

      const user = getUserByUsername.get(payload.username);
      if (!user) return { error: "User not found" };

      const { enabled } = body;

      updateGhostMode.run(enabled ? 1 : 0, user.id);

      return { success: true, ghostMode: enabled };
    } catch (error) {
      console.error("Update ghost mode error:", error);
      return { error: "Failed to update ghost mode" };
    }
  })
  .get("/:userId", async ({ jwt, headers, params }) => {
    const authorization = headers.authorization;
    if (!authorization) return { error: "Authentication required" };

    try {
      const payload = await jwt.verify(authorization.replace("Bearer ", ""));
      if (!payload) return { error: "Invalid token" };

      const user = getUserByUsername.get(payload.username);
      if (!user) return { error: "User not found" };

      const presence = getPresence.get(params.userId);

      if (!presence) {
        return { success: true, presence: null };
      }

      if (presence.ghost_mode) {
        return {
          success: true,
          presence: {
            online: false,
            last_seen: presence.last_seen,
            device: null,
          },
        };
      }

      return { success: true, presence };
    } catch (error) {
      console.error("Get presence error:", error);
      return { error: "Failed to get presence" };
    }
  })
  .post("/batch", async ({ jwt, headers, body }) => {
    const authorization = headers.authorization;
    if (!authorization) return { error: "Authentication required" };

    try {
      const payload = await jwt.verify(authorization.replace("Bearer ", ""));
      if (!payload) return { error: "Invalid token" };

      const user = getUserByUsername.get(payload.username);
      if (!user) return { error: "User not found" };

      const { userIds } = body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return { error: "User IDs are required" };
      }

      const limitedIds = userIds.slice(0, 50);
      const placeholders = limitedIds.map(() => "?").join(",");
      const query = db.query(`
        SELECT up.*, u.username FROM user_presence up
        JOIN users u ON up.user_id = u.id
        WHERE up.user_id IN (${placeholders})
      `);

      const presences = query.all(...limitedIds);

      const presenceMap = {};
      presences.forEach((presence) => {
        if (presence.ghost_mode) {
          presenceMap[presence.user_id] = {
            online: false,
            last_seen: presence.last_seen,
            device: null,
            username: presence.username,
          };
        } else {
          presenceMap[presence.user_id] = {
            online: presence.online,
            last_seen: presence.last_seen,
            device: presence.device,
            username: presence.username,
          };
        }
      });

      return { success: true, presences: presenceMap };
    } catch (error) {
      console.error("Get batch presence error:", error);
      return { error: "Failed to get presences" };
    }
  });

export const markUserOffline = (userId) => {
  try {
    db.query(
      `UPDATE user_presence SET online = 0, last_seen = datetime('now', 'utc'), updated_at = datetime('now', 'utc') WHERE user_id = ?`
    ).run(userId);
  } catch (error) {
    console.error("Failed to mark user offline:", error);
  }
};
