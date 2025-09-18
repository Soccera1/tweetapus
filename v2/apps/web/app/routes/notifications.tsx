import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
} from "@tweetapus/ui";
import {
  Bell,
  Heart,
  Home,
  MessageCircle,
  Repeat2,
  User,
  UserPlus,
} from "lucide-react";
import { apiCall, requireAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Notifications - Tweetapus" },
    { name: "description", content: "Your notifications on Tweetapus" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);

  try {
    const data = await apiCall("/notifications", {}, user.token);
    return json({ notifications: data.notifications || [], user });
  } catch {
    return json({ notifications: [], user });
  }
}

export default function Notifications() {
  const { notifications, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "retweet":
        return <Repeat2 className="h-5 w-5 text-green-500" />;
      case "reply":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
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
                <Bell className="h-5 w-5 mr-3" />
                Notifications
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

        <div className="flex-1 max-w-2xl border-x border-border">
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>

          <div>
            {notifications && notifications.length > 0 ? (
              notifications.map(
                (notification: {
                  id: string;
                  type: string;
                  content: string;
                  createdAt: string;
                  read: boolean;
                }) => (
                  <Card
                    key={notification.id}
                    className="border-l-0 border-r-0 border-t-0 rounded-none"
                  >
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">
                              <span className="font-medium">
                                {notification.content}
                              </span>
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>

                          {!notification.read && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  fetcher.submit(
                                    {},
                                    {
                                      method: "PATCH",
                                      action: `/notifications/${notification.id}/read`,
                                    }
                                  );
                                }}
                              >
                                Mark as read
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-2">
                  When someone interacts with your posts, you'll see it here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 p-4">
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-semibold mb-3">Stay updated</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>💬 Get notified about replies to your posts</p>
              <p>❤️ See who likes your content</p>
              <p>🔄 Track retweets and shares</p>
              <p>👥 Know when someone follows you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
