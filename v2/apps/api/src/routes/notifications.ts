import {
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationRead,
} from "@tweetapus/database";
import { Elysia } from "elysia";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = new Elysia({ prefix: "/notifications" })
  .use(requireAuth)

  .get("/", async ({ user, query }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const notifications = await getUserNotifications(user.id, limit, offset);
    return { notifications };
  })

  .get("/unread-count", async ({ user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const result = await getUnreadNotificationCount(user.id);
    return { count: result?.count || 0 };
  })

  .patch("/:id/read", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    try {
      await markNotificationRead(params.id);
      return { success: true };
    } catch {
      return { error: "Failed to mark notification as read" };
    }
  })

  .post("/mark-all-read", async ({ user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    try {
      const notifications = await getUserNotifications(user.id, 100, 0);

      await Promise.all(
        notifications.map((notification) =>
          markNotificationRead(notification.id)
        )
      );

      return { success: true };
    } catch {
      return { error: "Failed to mark all notifications as read" };
    }
  });
