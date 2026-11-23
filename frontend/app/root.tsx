import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRevalidator,
} from "react-router";

import type { Route } from "./+types/root";
import { Button } from "@/components/ui/button";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#f7f8fc] p-3 text-slate-950 md:p-4">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1800px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-2rem)] lg:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const revalidator = useRevalidator();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const details = notFound
    ? "The requested page could not be found."
    : isRouteErrorResponse(error)
      ? `The server responded with ${error.status}${error.statusText ? ` ${error.statusText}` : ""}.`
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">
          {notFound ? "404" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{details}</p>
        {!notFound && (
          <Button
            className="mt-4"
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === "loading"}
          >
            {revalidator.state === "loading" ? "Retrying…" : "Try again"}
          </Button>
        )}
      </div>
    </div>
  );
}
