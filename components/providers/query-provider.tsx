import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { queryClient } from '@/lib/query-client';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/**
 * MENTOR: Query provider + RN AppState → focusManager so queries refetch on resume.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
