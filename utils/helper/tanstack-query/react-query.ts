"use client";

import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24 * 30,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 30,

  // ✅ v5 way
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      return query.meta?.persist === true;
    },
  },
});
