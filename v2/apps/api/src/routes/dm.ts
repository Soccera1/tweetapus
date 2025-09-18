import {
  addConversationParticipant,
  createConversation,
  createMessage,
  getConversationMessages,
  getUserConversations,
} from "@tweetapus/database";
import { generateId } from "@tweetapus/shared";
import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { broadcastToUser } from "../websocket";

export const dmRouter = new Elysia({ prefix: "/dm" })
  .use(requireAuth)

  .get("/conversations", async ({ user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const conversations = await getUserConversations(user.id);
    return { conversations };
  })

  .post(
    "/conversations",
    async ({ body, user }) => {
      if (!user) {
        return { error: "Authentication required" };
      }

      const { participants, title } = body;

      if (!participants || participants.length === 0) {
        return { error: "At least one participant is required" };
      }

      try {
        const conversationId = generateId();

        const conversation = await createConversation({
          id: conversationId,
          type: participants.length > 1 ? "group" : "direct",
          title: title || null,
        });

        await addConversationParticipant({
          id: generateId(),
          conversationId,
          userId: user.id,
        });

        for (const participantId of participants) {
          if (participantId !== user.id) {
            await addConversationParticipant({
              id: generateId(),
              conversationId,
              userId: participantId,
            });
          }
        }

        return { success: true, conversation };
      } catch {
        return { error: "Failed to create conversation" };
      }
    },
    {
      body: t.Object({
        participants: t.Array(t.String()),
        title: t.Optional(t.String({ maxLength: 100 })),
      }),
    }
  )

  .get("/conversations/:id/messages", async ({ params, query, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const messages = await getConversationMessages(params.id, limit, offset);
    return { messages };
  })

  .post(
    "/conversations/:id/messages",
    async ({ params, body, user }) => {
      if (!user) {
        return { error: "Authentication required" };
      }

      const { content } = body;

      if (!content || content.trim().length === 0) {
        return { error: "Message content is required" };
      }

      if (content.length > 1000) {
        return { error: "Message must be 1000 characters or less" };
      }

      try {
        const message = await createMessage({
          id: generateId(),
          conversationId: params.id,
          senderId: user.id,
          content: content.trim(),
          messageType: "text",
        });

        broadcastToUser(user.id, {
          type: "new_message",
          data: {
            ...message,
            sender: user,
          },
        });

        return { success: true, message };
      } catch {
        return { error: "Failed to send message" };
      }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: 1000 }),
      }),
    }
  )

  .get("/conversations/:id", async ({ params, user }) => {
    if (!user) {
      return { error: "Authentication required" };
    }

    try {
      const messages = await getConversationMessages(params.id, 50, 0);
      return { conversation: { id: params.id }, messages };
    } catch {
      return { error: "Conversation not found" };
    }
  });
