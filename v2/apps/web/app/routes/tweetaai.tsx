import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@tweetapus/ui";
import {
  Bell,
  Bot,
  Home,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";
import { apiCall, requireAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "TweetaAI - Tweetapus" },
    { name: "description", content: "Chat with AI on Tweetapus" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);

  try {
    const [aiData, historyData] = await Promise.all([
      apiCall("/tweetaai", {}, user.token),
      apiCall("/tweetaai/history?limit=10", {}, user.token),
    ]);

    return json({
      aiInfo: aiData,
      chatHistory: historyData.chats || [],
      user,
    });
  } catch {
    return json({
      aiInfo: { description: "TweetaAI assistant", features: [] },
      chatHistory: [],
      user,
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const prompt = formData.get("prompt") as string;

  if (!prompt || prompt.trim().length === 0) {
    return json({ error: "Please enter a prompt" });
  }

  if (prompt.length > 500) {
    return json({ error: "Prompt must be 500 characters or less" });
  }

  try {
    const data = await apiCall(
      "/tweetaai/chat",
      {
        method: "POST",
        body: JSON.stringify({ prompt }),
      },
      user.token
    );

    if (data.success) {
      return redirect("/tweetaai");
    } else {
      return json({ error: data.error || "Failed to get AI response" });
    }
  } catch {
    return json({ error: "Network error" });
  }
}

export default function TweetaAI() {
  const { aiInfo, chatHistory, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [prompt, setPrompt] = useState("");
  const isSubmitting = navigation.state === "submitting";

  const characterCount = prompt.length;
  const isOverLimit = characterCount > 500;
  const canSubmit = prompt.trim().length > 0 && !isOverLimit && !isSubmitting;

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

              <Link to="/search">
                <Button variant="ghost" className="w-full justify-start">
                  <Search className="h-5 w-5 mr-3" />
                  Search
                </Button>
              </Link>

              <Link to="/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-5 w-5 mr-3" />
                  Notifications
                </Button>
              </Link>

              <Link to="/messages">
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Messages
                </Button>
              </Link>

              <Button variant="default" className="w-full justify-start">
                <Bot className="h-5 w-5 mr-3" />
                TweetaAI
              </Button>

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

        <div className="flex-1 max-w-4xl">
          <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TweetaAI</h1>
                <p className="text-sm text-muted-foreground">
                  Your AI assistant
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {!chatHistory.length && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Welcome to TweetaAI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{aiInfo.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium">What can I help you with?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {aiInfo.features?.map(
                        (feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            {feature}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ask TweetaAI</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      name="prompt"
                      placeholder="Ask me anything about trends, topics, or ideas..."
                      className="min-h-[100px] resize-none"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isSubmitting}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isOverLimit
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {characterCount}/500
                      </span>
                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Asking..." : "Ask AI"}
                      </Button>
                    </div>
                  </div>

                  {actionData?.error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {actionData.error}
                    </div>
                  )}
                </Form>
              </CardContent>
            </Card>

            {chatHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chatHistory.map((chat: any) => (
                    <div
                      key={chat.id}
                      className="space-y-3 pb-4 border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">You</p>
                          <p className="text-sm text-muted-foreground">
                            {chat.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">TweetaAI</p>
                          <div className="text-sm whitespace-pre-wrap">
                            {chat.response}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
