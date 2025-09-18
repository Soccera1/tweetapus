import {
  attachments,
  createPost,
  db,
  deletePost,
  getPostById,
  getPostReplies,
  getTimelinePosts,
  getUserByUsername,
  getUserPosts,
  isPostLikedByUser,
  isPostRetweetedByUser,
  likePost,
  retweetPost,
  unlikePost,
  unretweetPost,
} from "@tweetapus/database";
import { generateId } from "@tweetapus/shared";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";

export const postsRouter = new Elysia({ prefix: "/posts" })
  .use(requireAuth)

  .get("/", async ({ query }) => {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const posts = await getTimelinePosts(limit, offset);
    return { posts };
  })

  .post(
    "/",
    async ({ body, user }) => {
      const { content, replyTo, quoteTweetId, replyRestriction, imageUrl } =
        body;

      if (!user) {
        return { error: "Authentication required" };
      }

      try {
        const post = await createPost({
          id: generateId(),
          userId: user.id,
          content,
          replyTo: replyTo || null,
          quoteTweetId: quoteTweetId || null,
          replyRestriction: replyRestriction || "everyone",
          source: "web",
          pinned: false,
          likeCount: 0,
          replyCount: 0,
          retweetCount: 0,
          quoteCount: 0,
        });

        if (imageUrl && post) {
          const filename = imageUrl.split("/").pop() || "";
          const fileHash = filename.replace(".webp", "");

          await db.insert(attachments).values({
            id: generateId(),
            postId: post.id,
            fileHash,
            fileName: filename,
            fileType: "image/webp",
            fileSize: 0,
            fileUrl: imageUrl,
          });
        }

        return { success: true, post };
      } catch {
        return { error: "Failed to create post" };
      }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: 280 }),
        replyTo: t.Optional(t.String()),
        quoteTweetId: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        replyRestriction: t.Optional(
          t.Union([
            t.Literal("everyone"),
            t.Literal("followers"),
            t.Literal("following"),
            t.Literal("verified"),
          ])
        ),
      }),
    }
  )

  .get("/:id", async ({ params }) => {
    const post = await getPostById(params.id);
    if (!post) {
      return { error: "Post not found" };
    }
    return { post };
  })

  .delete("/:id", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const post = await getPostById(params.id);
    if (!post) {
      return { error: "Post not found" };
    }

    if (post.post.userId !== user.id && !user.admin) {
      return { error: "Not authorized to delete this post" };
    }

    await deletePost(params.id);
    return { success: true };
  })

  .get("/:id/replies", async ({ params, query }) => {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const replies = await getPostReplies(params.id, limit, offset);
    return { replies };
  })

  .post("/:id/like", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const existingLike = await isPostLikedByUser(user.id, params.id);
    if (existingLike) {
      return { error: "Post already liked" };
    }

    await likePost(user.id, params.id, generateId());
    return { success: true };
  })

  .delete("/:id/like", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const existingLike = await isPostLikedByUser(user.id, params.id);
    if (!existingLike) {
      return { error: "Post not liked" };
    }

    await unlikePost(user.id, params.id);
    return { success: true };
  })

  .post("/:id/retweet", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const existingRetweet = await isPostRetweetedByUser(user.id, params.id);
    if (existingRetweet) {
      return { error: "Post already retweeted" };
    }

    await retweetPost(user.id, params.id, generateId());
    return { success: true };
  })

  .delete("/:id/retweet", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const existingRetweet = await isPostRetweetedByUser(user.id, params.id);
    if (!existingRetweet) {
      return { error: "Post not retweeted" };
    }

    await unretweetPost(user.id, params.id);
    return { success: true };
  })

  .get("/user/:username", async ({ params, query }) => {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const user = await getUserByUsername(params.username);
    if (!user) {
      return { error: "User not found" };
    }

    const posts = await getUserPosts(user.id, limit, offset);
    return { posts };
  });
