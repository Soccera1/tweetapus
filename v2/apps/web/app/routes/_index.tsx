import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tweetapus/ui";
import { getOptionalUser } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Tweetapus v2" },
    { name: "description", content: "Welcome to the new Tweetapus!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getOptionalUser(request);
  return { user };
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Welcome back, {user.name}!
                </CardTitle>
                <CardDescription className="text-center">
                  Ready to see what's happening?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="flex gap-4 justify-center">
                    <Link to="/timeline-new">
                      <Button size="lg">Go to Timeline</Button>
                    </Link>
                    <Link to={`/profile/${user.username}`}>
                      <Button variant="outline" size="lg">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Welcome to Tweetapus v2
              </CardTitle>
              <CardDescription className="text-center">
                The new and improved social media platform built with modern
                technologies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Built with Remix, React, shadcn/ui, Elysia, and Bun
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/register">
                    <Button size="lg">Sign Up</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">
                  🚧 Currently in Development
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Project structure setup</li>
                  <li>✅ Database layer with Drizzle ORM</li>
                  <li>✅ Authentication system</li>
                  <li>✅ Basic UI components</li>
                  <li>✅ Post creation system</li>
                  <li>🔄 User management</li>
                  <li>🔄 Post interactions</li>
                  <li>⏳ Social features</li>
                  <li>⏳ Direct messaging</li>
                  <li>⏳ Admin panel</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
