import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
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
  Textarea,
} from "@tweetapus/ui";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Timeline - Tweetapus" },
    { name: "description", content: "Your Tweetapus timeline" },
  ];
};

export async function loader() {
  const mockPosts = [
    {
      post: {
        id: "1",
        content:
          "Just set up the new Tweetapus v2! 🚀 The tech stack is amazing - Remix + Elysia + shadcn/ui feels so smooth to work with.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likeCount: 12,
        retweetCount: 3,
        replyCount: 5,
      },
      author: {
        id: "1",
        username: "john_doe",
        name: "John Doe",
      },
    },
    {
      post: {
        id: "2",
        content:
          "Anyone else excited about the new features coming to Tweetapus? The development progress is looking really promising!",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likeCount: 8,
        retweetCount: 1,
        replyCount: 2,
      },
      author: {
        id: "2",
        username: "jane_smith",
        name: "Jane Smith",
      },
    },
  ];

  return json({ posts: mockPosts, error: null });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const content = formData.get("content") as string;

  if (intent === "create_post") {
    if (!content || content.trim().length === 0) {
      return json({ error: "Post content is required" });
    }

    if (content.length > 280) {
      return json({ error: "Post must be 280 characters or less" });
    }

    return redirect("/timeline");
  }

  return json({ success: true });
}

interface Post {
  post: {
    id: string;
    content: string;
    createdAt: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
  };
  author: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
}

function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [likeCount, setLikeCount] = useState(post.post.likeCount);
  const [retweetCount, setRetweetCount] = useState(post.post.retweetCount);

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
  };

  const handleRetweet = () => {
    const newIsRetweeted = !isRetweeted;
    setIsRetweeted(newIsRetweeted);
    setRetweetCount((prev) => (newIsRetweeted ? prev + 1 : prev - 1));
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-l-0 border-r-0 border-t-0 rounded-none">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {post.author?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm truncate">
                {post.author?.name || "Unknown"}
              </h3>
              <span className="text-muted-foreground text-sm">
                @{post.author?.username || "unknown"}
              </span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">
                {timeAgo(post.post.createdAt)}
              </span>
              <div className="ml-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="mt-2 text-sm">{post.post.content}</p>

            <div className="flex items-center justify-between mt-3 max-w-md">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.post.replyCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground hover:text-green-600 ${
                  isRetweeted ? "text-green-600" : ""
                }`}
                onClick={handleRetweet}
              >
                <Repeat2 className="h-4 w-4 mr-1" />
                {retweetCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground hover:text-red-600 ${
                  isLiked ? "text-red-600" : ""
                }`}
                onClick={handleLike}
              >
                <Heart
                  className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`}
                />
                {likeCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComposeCard() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [content, setContent] = useState("");
  const isSubmitting = navigation.state === "submitting";

  const characterCount = content.length;
  const isOverLimit = characterCount > 280;
  const canPost = content.trim().length > 0 && !isOverLimit;

  return (
    <Card className="border-l-0 border-r-0 border-t-0 rounded-none">
      <CardContent className="p-4">
        <Form method="post" className="flex space-x-3">
          <input type="hidden" name="intent" value="create_post" />

          <Avatar className="h-10 w-10">
            <AvatarFallback>YU</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <Textarea
              name="content"
              placeholder="What's happening?"
              className="min-h-[80px] border-0 p-0 resize-none focus-visible:ring-0 text-lg"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />

            {actionData?.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">
                {actionData.error}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <span
                  className={`text-sm ${isOverLimit ? "text-destructive" : ""}`}
                >
                  {characterCount}/280
                </span>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={!canPost || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function Timeline() {
  const { posts, error } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto border-x border-border">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
          <h1 className="text-xl font-bold">Home</h1>
        </div>

        <ComposeCard />

        <div>
          {error && (
            <div className="p-4 text-center text-destructive">
              <p>Failed to load posts: {error}</p>
            </div>
          )}

          {posts && posts.length > 0 ? (
            posts.map((post: Post) => (
              <PostCard key={post.post.id} post={post} />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No posts yet! 🎉</p>
              <p className="text-sm mt-2">Be the first to post something.</p>
            </div>
          )}
        </div>

        <div className="p-8 text-center text-muted-foreground">
          <p>That's all for now! 🎉</p>
        </div>
      </div>
    </div>
  );
}
