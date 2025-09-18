import type { ReactNode } from "react";
import { Navigation } from "./navigation";

interface AppLayoutProps {
  user: {
    id: string;
    username: string;
    name: string;
  };
  children: ReactNode;
  sidebar?: ReactNode;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function AppLayout({
  user,
  children,
  sidebar,
  unreadNotifications = 0,
  unreadMessages = 0,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto flex">
        <Navigation
          user={user}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />

        <div className="flex-1 md:max-w-2xl border-x border-border">
          {children}
        </div>

        {sidebar && <div className="hidden lg:block w-80 p-4">{sidebar}</div>}
      </div>
    </div>
  );
}
