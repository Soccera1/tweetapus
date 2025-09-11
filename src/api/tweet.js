import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import db from "./../db.js";
import ratelimit from "../helpers/ratelimit.js";

const JWT_SECRET = process.env.JWT_SECRET;

const getUserByUsername = (username) =>
	db.query("SELECT * FROM users WHERE username = ?").get(username);

const createLike = (userId, postId) => {
	const result = db
		.query("INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)")
		.run(crypto.randomUUID(), userId, postId);

	db.query("UPDATE posts SET like_count = like_count + 1 WHERE id = ?").run(
		postId,
	);

	return result;
};

const removeLike = (userId, postId) => {
	const result = db
		.query("DELETE FROM likes WHERE user_id = ? AND post_id = ?")
		.run(userId, postId);

	if (result.changes > 0) {
		db.query("UPDATE posts SET like_count = like_count - 1 WHERE id = ?").run(
			postId,
		);
	}

	return result;
};

const getUserLike = (userId, postId) =>
	db
		.query("SELECT * FROM likes WHERE user_id = ? AND post_id = ?")
		.get(userId, postId);

const createPost = (userId, content, replyTo = null) => {
	const result = db
		.query(
			"INSERT INTO posts (user_id, content, reply_to) VALUES (?, ?, ?) RETURNING *",
		)
		.get(userId, content, replyTo);

	db.query(
		"UPDATE user_profiles SET post_count = post_count + 1 WHERE user_id = ?",
	).run(userId);

	if (replyTo) {
		db.query("UPDATE posts SET reply_count = reply_count + 1 WHERE id = ?").run(
			replyTo,
		);
	}

	return result;
};

const getPost = (postId) =>
	db
		.query(`
  SELECT posts.*, users.username, user_profiles.display_name
  FROM posts 
  JOIN users ON posts.user_id = users.id 
  LEFT JOIN user_profiles ON users.id = user_profiles.user_id
  WHERE posts.id = ?
`)
		.get(postId);

const getPostReplies = (postId) =>
	db
		.query(`
  SELECT posts.*, users.username, user_profiles.display_name
  FROM posts 
  JOIN users ON posts.user_id = users.id 
  LEFT JOIN user_profiles ON users.id = user_profiles.user_id
  WHERE posts.reply_to = ?
  ORDER BY posts.created_at ASC
`)
		.all(postId);

const getPostThread = (postId) => {
	const post = getPost(postId);
	if (!post) return null;

	let rootPost = post;
	const threadPosts = [];

	while (rootPost.reply_to) {
		const parentPost = getPost(rootPost.reply_to);
		if (!parentPost) break;
		threadPosts.unshift(parentPost);
		rootPost = parentPost;
	}

	threadPosts.push(post);

	const replies = getPostReplies(postId);

	return {
		post,
		threadPosts,
		replies,
		rootPost,
	};
};

export default new Elysia({ prefix: "/tweets" })
	.use(jwt({ name: "jwt", secret: JWT_SECRET }))
	.use(
		rateLimit({
			duration: 15_000,
			max: 30,
			scoping: "scoped",
			generator: ratelimit,
		}),
	)
	.post("/", async ({ body, jwt, headers }) => {
		const authorization = headers.authorization;
		if (!authorization) {
			return { error: "No authorization header" };
		}

		const token = authorization.replace("Bearer ", "");
		try {
			const payload = await jwt.verify(token);
			if (!payload) {
				return { error: "Invalid token" };
			}

			const user = getUserByUsername(payload.username);
			if (!user) {
				return { error: "User not found" };
			}

			const { content, text, reply_to } = body;
			const tweetContent = content || text;

			if (!tweetContent?.trim()) return { error: "Content is required" };
			if (tweetContent.length > 280)
				return { error: "Content must be less than 280 characters" };

			if (reply_to && !getPost(reply_to))
				return { error: "Parent post not found" };

			const post = createPost(user.id, tweetContent.trim(), reply_to);

			return { success: true, post: { ...post, username: user.username } };
		} catch {
			return { error: "Authentication failed" };
		}
	})
	.get("/:id", async ({ params, jwt, headers }) => {
		const authorization = headers.authorization;
		if (!authorization) {
			return { error: "Authentication required" };
		}

		let user;
		try {
			const token = authorization.replace("Bearer ", "");
			const payload = await jwt.verify(token);
			if (!payload) {
				return { error: "Invalid token" };
			}

			user = getUserByUsername(payload.username);
			if (!user) {
				return { error: "User not found" };
			}
		} catch {
			return { error: "Authentication failed" };
		}

		const thread = getPostThread(params.id);
		if (!thread) return { error: "Post not found" };

		// Add like information to all posts in the thread
		const addLikeInfo = (posts) => {
			const postIds = posts.map((p) => p.id);
			if (postIds.length === 0) return posts;

			const likePlaceholders = postIds.map(() => "?").join(",");
			const getUserLikesQuery = db.query(
				`SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${likePlaceholders})`,
			);

			const userLikes = getUserLikesQuery.all(user.id, ...postIds);
			const userLikedPosts = new Set(userLikes.map((like) => like.post_id));

			return posts.map((post) => ({
				...post,
				liked_by_user: userLikedPosts.has(post.id),
			}));
		};

		// Add like info to the main post
		const postWithLikes = addLikeInfo([thread.post])[0];

		// Add like info to thread posts
		const threadPostsWithLikes = addLikeInfo(thread.threadPosts);

		// Add like info to replies
		const repliesWithLikes = addLikeInfo(thread.replies);

		return {
			success: true,
			post: postWithLikes,
			threadPosts: threadPostsWithLikes,
			replies: repliesWithLikes,
			rootPost: thread.rootPost,
		};
	})
	.post("/:id/like", async ({ params, jwt, headers }) => {
		const authorization = headers.authorization;
		if (!authorization) {
			return { error: "No authorization header" };
		}

		const token = authorization.replace("Bearer ", "");
		try {
			const payload = await jwt.verify(token);
			if (!payload) {
				return { error: "Invalid token" };
			}

			const user = getUserByUsername(payload.username);
			if (!user) {
				return { error: "User not found" };
			}

			const postId = parseInt(params.id);
			if (!getPost(postId)) {
				return { error: "Post not found" };
			}

			// Check if already liked
			const existingLike = getUserLike(user.id, postId);
			if (existingLike) {
				return { error: "Post already liked" };
			}

			createLike(user.id, postId);
			return { success: true, message: "Post liked" };
		} catch {
			return { error: "Authentication failed" };
		}
	})
	.delete("/:id/like", async ({ params, jwt, headers }) => {
		const authorization = headers.authorization;
		if (!authorization) {
			return { error: "No authorization header" };
		}

		const token = authorization.replace("Bearer ", "");
		try {
			const payload = await jwt.verify(token);
			if (!payload) {
				return { error: "Invalid token" };
			}

			const user = getUserByUsername(payload.username);
			if (!user) {
				return { error: "User not found" };
			}

			const postId = parseInt(params.id);
			if (!getPost(postId)) {
				return { error: "Post not found" };
			}

			const result = removeLike(user.id, postId);
			if (result.changes === 0) {
				return { error: "Post not liked" };
			}

			return { success: true, message: "Post unliked" };
		} catch {
			return { error: "Authentication failed" };
		}
	});
