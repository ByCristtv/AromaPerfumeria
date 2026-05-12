"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 5 minutes — prevents unnecessary refetches
            staleTime: 5 * 60 * 1000,
            // Cache data for 10 minutes after it's no longer used
            gcTime: 10 * 60 * 1000,
            // Refetch when the user returns to the tab (fixes the tab-switch issue)
            refetchOnWindowFocus: true,
            // Retry failed requests once before giving up
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
