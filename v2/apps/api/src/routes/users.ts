import {
  followUser,
  getUserByUsername,
  getUserFollowers,
  getUserFollowing,
  isUserFollowing,
  unfollowUser,
  updateUser,
} from "@tweetapus/database";
import { generateId } from "@tweetapus/shared";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";

export const usersRouter = new Elysia({ prefix: "/users" })
  .use(requireAuth)

  .get("/:username", async ({ params }) => {
    const user = await getUserByUsername(params.username);
    if (!user) {
      return { error: "User not found" };
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  })

  .patch(
    "/me",
    async ({ body, user }) => {
      if (!user) {
        return { error: "Authentication required" };
      }

      const { name, bio, location, website, pronouns } = body;

      try {
        const updatedUser = await updateUser(user.id, {
          name: name || user.name,
          bio: bio || user.bio,
          location: location || user.location,
          website: website || user.website,
          pronouns: pronouns || user.pronouns,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return { success: true, user: userWithoutPassword };
      } catch {
        return { error: "Failed to update profile" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 50 })),
        bio: t.Optional(t.String({ maxLength: 160 })),
        location: t.Optional(t.String({ maxLength: 30 })),
        website: t.Optional(t.String()),
        pronouns: t.Optional(t.String({ maxLength: 20 })),
      }),
    }
  )

  .get("/:username/followers", async ({ params, query }) => {
    const targetUser = await getUserByUsername(params.username);
    if (!targetUser) {
      return { error: "User not found" };
    }

    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const followers = await getUserFollowers(targetUser.id, limit, offset);
    return { followers };
  })

  .get("/:username/following", async ({ params, query }) => {
    const targetUser = await getUserByUsername(params.username);
    if (!targetUser) {
      return { error: "User not found" };
    }

    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const following = await getUserFollowing(targetUser.id, limit, offset);
    return { following };
  })

  .post("/:username/follow", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const targetUser = await getUserByUsername(params.username);
    if (!targetUser) {
      return { error: "User not found" };
    }

    if (targetUser.id === user.id) {
      return { error: "Cannot follow yourself" };
    }

    const alreadyFollowing = await isUserFollowing(user.id, targetUser.id);
    if (alreadyFollowing) {
      return { error: "Already following this user" };
    }

    try {
      await followUser(user.id, targetUser.id, generateId());
      return { success: true };
    } catch {
      return { error: "Failed to follow user" };
    }
  })

  .delete("/:username/follow", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const targetUser = await getUserByUsername(params.username);
    if (!targetUser) {
      return { error: "User not found" };
    }

    const isFollowing = await isUserFollowing(user.id, targetUser.id);
    if (!isFollowing) {
      return { error: "Not following this user" };
    }

    try {
      await unfollowUser(user.id, targetUser.id);
      return { success: true };
    } catch {
      return { error: "Failed to unfollow user" };
    }
  })

  .get("/:username/relationship", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const targetUser = await getUserByUsername(params.username);
    if (!targetUser) {
      return { error: "User not found" };
    }

    if (targetUser.id === user.id) {
      return { relationship: "self" };
    }

    const following = await isUserFollowing(user.id, targetUser.id);
    const followedBy = await isUserFollowing(targetUser.id, user.id);

    return {
      relationship: {
        following: !!following,
        followedBy: !!followedBy,
      },
    };
  });
