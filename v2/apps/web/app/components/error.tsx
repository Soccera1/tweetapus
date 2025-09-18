import { Button, Card, CardContent } from "@tweetapus/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorMessage
          title="Application Error"
          message="The application encountered an unexpected error. Please refresh the page to continue."
          onRetry={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
