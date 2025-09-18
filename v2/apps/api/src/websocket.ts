import type { WSContext } from "elysia";

interface WSData {
  type: string;
  userId?: string;
  username?: string;
}

const connectedUsers = new Map<string, Set<WSContext<unknown, WSData>>>();

export const wsHandler = {
  message: (ws: WSContext<unknown, WSData>, message: string | Buffer) => {
    try {
      // biome-ignore lint/suspicious/noImplicitAnyLet: i do not gaf true
      let data; // do i continue doing the rewrite with flower or did you do some things already sure, continue the rewrite ok
      if (typeof message === "string") {
        data = JSON.parse(message);
      } else {
        data = JSON.parse(message.toString());
        /* Happies. API is running true */
      }

      if (data.type === "authenticate") {
        const { token } = data;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            ws.data.userId = payload.userId;
            ws.data.username = payload.username;

            if (!connectedUsers.has(payload.userId)) {
              connectedUsers.set(payload.userId, new Set());
            }
            connectedUsers.get(payload.userId)?.add(ws);

            ws.send(JSON.stringify({ type: "authenticated", success: true }));
          } catch {
            ws.send(
              JSON.stringify({
                type: "authenticated",
                success: false,
                error: "Invalid token",
              })
            );
          }
        }
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  },

  close: (ws: WSContext<unknown, WSData>) => {
    if (ws.data.userId && connectedUsers.has(ws.data.userId)) {
      connectedUsers.get(ws.data.userId)?.delete(ws);
      if (connectedUsers.get(ws.data.userId)?.size === 0) {
        connectedUsers.delete(ws.data.userId);
      }
    }
  },
};

export function broadcastToUser(userId: string, message: unknown) {
  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    for (const socket of userSockets) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
        userSockets.delete(socket);
      }
    }
  }
}
