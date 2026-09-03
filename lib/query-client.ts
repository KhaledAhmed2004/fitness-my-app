import { QueryClient } from '@tanstack/react-query';

/**
 * MENTOR: Shared QueryClient — RN focus is driven via AppState + focusManager,
 * so refetchOnWindowFocus stays false here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Driven by AppState → focusManager in QueryProvider (RN has no window)
      refetchOnWindowFocus: true,
    },
  },
});
