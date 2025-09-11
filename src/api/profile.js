import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import db from "./../db.js";
import ratelimit from "../helpers/ratelimit.js";

const JWT_SECRET = process.env.JWT_SECRET;

const getUserByUsername = (username) =>
    db.query("SELECT * FROM users WHERE username = ?").get(username);

const getProfileByUserId = (userId) =>
    db.query("SELECT * FROM user_profiles WHERE user_id = ?").get(userId);

// Add function to create profile if it doesn't exist
const getOrCreateProfileByUserId = (userId) => {
    let profile = getProfileByUserId(userId);
    if (!profile) {
        // Create a default profile for existing users
        db.query(
            `INSERT INTO user_profiles (user_id, display_name, bio, location, website, follower_count, following_count, post_count) 
            VALUES (?, NULL, NULL, NULL, NULL, 0, 0, 0)`
        ).run(userId);
        profile = getProfileByUserId(userId);
    }
    return profile;
};

const getFollowStatus = (followerId, followingId) =>
    db
        .query("SELECT * FROM follows WHERE follower_id = ? AND following_id = ?")
        .get(followerId, followingId);

const getUserPosts = (userId) =>
    db
        .query(`
  SELECT posts.*, users.username 
  FROM posts 
  JOIN users ON posts.user_id = users.id 
  WHERE posts.user_id = ? 
  ORDER BY posts.created_at DESC 
  LIMIT 20
`)
        .all(userId);

const updateProfile = (userId, { display_name, bio, location, website }) =>
    db
        .query(`
  UPDATE user_profiles 
  SET display_name = ?, bio = ?, location = ?, website = ?, updated_at = datetime('now')
  WHERE user_id = ? RETURNING *
`)
        .get(display_name, bio, location, website, userId);

export default new Elysia({ prefix: "/profile" })
    .use(jwt({ name: "jwt", secret: JWT_SECRET }))
    .use(
        rateLimit({
            duration: 15_000,
            max: 50,
            scoping: "scoped",
            generator: ratelimit,
        }),
    )
    .get("/:username", async ({ params, jwt, headers }) => {
        const user = getUserByUsername(params.username);
        if (!user) return { error: "User not found" };

        // Use getOrCreateProfileByUserId instead of getProfileByUserId
        const profile = getOrCreateProfileByUserId(user.id);
        if (!profile) return { error: "Profile not found" };

        const posts = getUserPosts(user.id);
        let isFollowing = false;
        let isOwnProfile = false;

        const authorization = headers.authorization;
        if (authorization) {
            try {
                const payload = await jwt.verify(authorization.replace("Bearer ", ""));
                if (payload) {
                    const currentUser = getUserByUsername(payload.username);
                    if (currentUser) {
                        isOwnProfile = currentUser.id === user.id;
                        if (!isOwnProfile)
                            isFollowing = !!getFollowStatus(currentUser.id, user.id);
                    }
                }
            } catch {}
        }

        return {
            user: {
                id: user.id,
                username: user.username,
                created_at: user.created_at,
            },
            profile: {
                display_name: profile.display_name || user.username,
                bio: profile.bio || "",
                location: profile.location || "",
                website: profile.website || "",
                follower_count: profile.follower_count || 0,
                following_count: profile.following_count || 0,
                post_count: profile.post_count || 0,
            },
            posts,
            isFollowing,
            isOwnProfile,
        };
    })
    .put("/:username", async ({ params, body, jwt, headers }) => {
        const authorization = headers.authorization;
        if (!authorization) return { error: "Authentication required" };

        try {
            const payload = await jwt.verify(authorization.replace("Bearer ", ""));
            if (!payload) return { error: "Invalid token" };

            const currentUser = getUserByUsername(payload.username);
            const targetUser = getUserByUsername(params.username);

            if (!currentUser || !targetUser || currentUser.id !== targetUser.id) {
                return { error: "Can only edit your own profile" };
            }

            const { display_name, bio, location, website } = body;

            if (display_name && display_name.length > 50)
                return { error: "Display name must be less than 50 characters" };
            if (bio && bio.length > 160)
                return { error: "Bio must be less than 160 characters" };
            if (location && location.length > 30)
                return { error: "Location must be less than 30 characters" };
            if (website && website.length > 100)
                return { error: "Website must be less than 100 characters" };

            // Ensure profile exists before updating
            const profile = getOrCreateProfileByUserId(targetUser.id);
            if (!profile) return { error: "Profile not found" };

            const updatedProfile = updateProfile(targetUser.id, {
                display_name: display_name || profile.display_name,
                bio: bio !== undefined ? bio : profile.bio,
                location: location !== undefined ? location : profile.location,
                website: website !== undefined ? website : profile.website,
            });

            return { success: true, profile: updatedProfile };
        } catch {
            return { error: "Authentication failed" };
        }
    })
    .post("/:username/follow", async ({ params, jwt, headers }) => {
        const authorization = headers.authorization;
        if (!authorization) return { error: "Authentication required" };

        try {
            const payload = await jwt.verify(authorization.replace("Bearer ", ""));
            if (!payload) return { error: "Invalid token" };

            const currentUser = getUserByUsername(payload.username);
            const targetUser = getUserByUsername(params.username);

            if (!currentUser || !targetUser) return { error: "User not found" };
            if (currentUser.id === targetUser.id)
                return { error: "Cannot follow yourself" };
            if (getFollowStatus(currentUser.id, targetUser.id))
                return { error: "Already following this user" };

            db.query(
                "INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)",
            ).run(Bun.randomUUIDv7(), currentUser.id, targetUser.id);
            db.query(
                "UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = ?",
            ).run(currentUser.id);
            db.query(
                "UPDATE user_profiles SET follower_count = follower_count + 1 WHERE user_id = ?",
            ).run(targetUser.id);

            return { success: true, following: true };
        } catch {
            return { error: "Authentication failed" };
        }
    })
    .delete("/:username/follow", async ({ params, jwt, headers }) => {
        const authorization = headers.authorization;
        if (!authorization) return { error: "Authentication required" };

        try {
            const payload = await jwt.verify(authorization.replace("Bearer ", ""));
            if (!payload) return { error: "Invalid token" };

            const currentUser = getUserByUsername(payload.username);
            const targetUser = getUserByUsername(params.username);

            if (!currentUser || !targetUser) return { error: "User not found" };
            if (!getFollowStatus(currentUser.id, targetUser.id))
                return { error: "Not following this user" };

            db.query(
                "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
            ).run(currentUser.id, targetUser.id);
            db.query(
                "UPDATE user_profiles SET following_count = following_count - 1 WHERE user_id = ? AND following_count > 0",
            ).run(currentUser.id);
            db.query(
                "UPDATE user_profiles SET follower_count = follower_count - 1 WHERE user_id = ? AND follower_count > 0",
            ).run(targetUser.id);

            return { success: true, following: false };
        } catch {
            return { error: "Authentication failed" };
        }
    });