"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            // Default refetchOnWindowFocus (true) only refetches stale
            // queries — combined with the 5min staleTime above, a tab
            // switch within 5min refetches nothing. The previous
            // 'always' setting caused a thundering herd on every focus
            // event, which queued behind Supabase's auth-refresh lock
            // and froze the UI on "Buscando fragancias...".
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
