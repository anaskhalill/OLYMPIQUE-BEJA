"use client";

import { useEffect, useRef } from "react";

type ReporterProps = {
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorReporter({ error, reset }: ReporterProps) {
  const lastOverlayMsg = useRef("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onError = (_e: ErrorEvent) => {
      // Log to console in development only
      if (process.env.NODE_ENV === "development") {
        console.error("[ErrorReporter]", _e.message);
      }
    };

    const onReject = (e: PromiseRejectionEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[ErrorReporter] Unhandled rejection:", e.reason);
      }
    };

    const pollOverlay = () => {
      if (process.env.NODE_ENV !== "development") return;
      const overlay = document.querySelector("[data-nextjs-dialog-overlay]");
      const node =
        overlay?.querySelector(
          "h1, h2, .error-message, [data-nextjs-dialog-body]"
        ) ?? null;
      const txt = node?.textContent ?? node?.innerHTML ?? "";
      if (txt && txt !== lastOverlayMsg.current) {
        lastOverlayMsg.current = txt;
        console.error("[ErrorReporter] Dev overlay:", txt);
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    pollRef.current = setInterval(pollOverlay, 1000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!error) return null;

  return (
    <html>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again later.
            </p>
          </div>
          <div className="space-y-2">
            {reset && (
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            )}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error.message}
                  {error.stack && (
                    <div className="mt-2 text-muted-foreground">
                      {error.stack}
                    </div>
                  )}
                  {error.digest && (
                    <div className="mt-2 text-muted-foreground">
                      Digest: {error.digest}
                    </div>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
