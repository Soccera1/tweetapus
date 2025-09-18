import { Link, useLocation } from "@remix-run/react";
import { Avatar, AvatarFallback, Button } from "@tweetapus/ui";
import {
  Bell,
  Bot,
  Home,
  Menu,
  MessageCircle,
  Search,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  user: {
    id: string;
    username: string;
    name: string;
  };
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function Navigation({
  user,
  unreadNotifications = 0,
  unreadMessages = 0,
}: NavigationProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/timeline-new", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadNotifications,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
      badge: unreadMessages,
    },
    { name: "TweetaAI", href: "/tweetaai", icon: Bot },
    { name: "Profile", href: `/profile/${user.username}`, icon: User },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <div className="hidden md:flex w-64 bg-card border-r p-4 h-screen sticky top-0 flex-col">
        <div className="space-y-4 flex-1">
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Tweetapus</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className="w-full justify-start relative"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-4">
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
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden sticky top-0 bg-background/95 backdrop-blur border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tweetapus</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="w-full justify-start relative"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t">
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
        )}
      </div>
    </>
  );
}
