import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  Input,
} from "@tweetapus/ui";
import { ArrowLeft, Bell, Home, MessageCircle, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiCall, requireAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Messages - Tweetapus" },
    { name: "description", content: "Your direct messages on Tweetapus" },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const conversationId = params.conversationId;

  try {
    const [conversationsData, messagesData] = await Promise.all([
      apiCall("/dm/conversations", {}, user.token),
      conversationId
        ? apiCall(
            `/dm/conversations/${conversationId}/messages`,
            {},
            user.token
          )
        : Promise.resolve({ messages: [] }),
    ]);

    return json({
      conversations: conversationsData.conversations || [],
      messages: messagesData.messages || [],
      currentConversation: conversationId,
      user,
    });
  } catch {
    return json({
      conversations: [],
      messages: [],
      currentConversation: null,
      user,
    });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const content = formData.get("content") as string;
  const conversationId = params.conversationId;

  if (!content || !conversationId) {
    return json({ error: "Message content and conversation ID are required" });
  }

  try {
    const data = await apiCall(
      `/dm/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      user.token
    );

    if (data.success) {
      return redirect(`/messages/${conversationId}`);
    } else {
      return json({ error: data.error || "Failed to send message" });
    }
  } catch {
    return json({ error: "Network error" });
  }
}

export default function Messages() {
  const { conversations, messages, currentConversation, user } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (newMessage.trim() && currentConversation) {
      fetcher.submit(
        { content: newMessage },
        { method: "POST", action: `/messages/${currentConversation}` }
      );
      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto flex">
        <div className="w-64 bg-card border-r p-4 h-screen sticky top-0">
          <div className="space-y-4">
            <div className="px-4 py-2">
              <h1 className="text-xl font-bold">Tweetapus</h1>
            </div>

            <nav className="space-y-2">
              <Link to="/timeline-new">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-5 w-5 mr-3" />
                  Home
                </Button>
              </Link>

              <Button variant="default" className="w-full justify-start">
                <MessageCircle className="h-5 w-5 mr-3" />
                Messages
              </Button>

              <Link to="/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-5 w-5 mr-3" />
                  Notifications
                </Button>
              </Link>

              <Link to={`/profile/${user.username}`}>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Button>
              </Link>
            </nav>

            <div className="mt-auto pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-card border-r">
          <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4">
            <h2 className="text-lg font-bold">Messages</h2>
          </div>

          <div className="overflow-y-auto max-h-screen">
            {conversations.length > 0 ? (
              conversations.map((conv: any) => (
                <Link
                  key={conv.conversation.id}
                  to={`/messages/${conv.conversation.id}`}
                  className={`block p-4 border-b hover:bg-muted/50 ${
                    currentConversation === conv.conversation.id
                      ? "bg-muted"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conv.participant?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {conv.participant?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{conv.participant?.username || "unknown"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">
                  Start a conversation from a user profile
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4">
                <div className="flex items-center gap-4">
                  <Link to="/messages">
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <h2 className="text-lg font-bold">Conversation</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg: any) => (
                  <div
                    key={msg.message.id}
                    className={`flex ${
                      msg.sender?.id === user.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        msg.sender?.id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatTime(msg.message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                <Form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    maxLength={1000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || fetcher.state !== "idle"}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">
                  Select a conversation
                </h2>
                <p>
                  Choose from your existing conversations or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
