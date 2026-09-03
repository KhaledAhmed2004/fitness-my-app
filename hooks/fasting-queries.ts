import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { fastingKeys } from '@/lib/query-keys';
import {
  cancelFast,
  fallbackSelectableProtocols,
  fetchActiveFast,
  fetchFastingHistory,
  fetchFastingPreference,
  fetchFastingProtocols,
  startFast,
  stopFast,
  toSelectableProtocols,
  updateActiveFast,
  updateFastingPreference,
  updateHistoricalFast,
} from '@/services/fasting-api';
import type { FastingPreference, FastingProtocol, FastingSessionStatus, StartFastingInput } from '@/types/fasting';

export function useFastingProtocols() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: fastingKeys.protocols(),
    queryFn: fetchFastingProtocols,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30,
    select: toSelectableProtocols,
    placeholderData: () =>
      fallbackSelectableProtocols().map((p) => ({
        code: p.code as typeof p.code,
        fastingHours: p.fastingHours,
        eatingHours: p.eatingHours,
      })),
  });
}

export function useFastingPreference() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: fastingKeys.preference(),
    queryFn: fetchFastingPreference,
    enabled: isAuthenticated,
  });
}

export function useActiveFast() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: fastingKeys.active(),
    queryFn: fetchActiveFast,
    enabled: isAuthenticated,
  });
}

export function useFastingHistory(enabled: boolean) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: fastingKeys.history(),
    queryFn: () => fetchFastingHistory(1, 20),
    enabled: isAuthenticated && enabled,
    select: (page) => page.data,
  });
}

export function useInfiniteFastingHistory(enabled: boolean = true) {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: [...fastingKeys.history(), 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchFastingHistory(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: isAuthenticated && enabled,
  });
}

export function useSelectProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (protocol: Exclude<FastingProtocol, 'CUSTOM'>) =>
      updateFastingPreference({ protocol }),
    onMutate: async (protocol) => {
      await qc.cancelQueries({ queryKey: fastingKeys.preference() });
      const previousPreference = qc.getQueryData<FastingPreference>(fastingKeys.preference());
      if (previousPreference) {
        qc.setQueryData<FastingPreference>(fastingKeys.preference(), {
          ...previousPreference,
          protocol,
        });
      }
      return { previousPreference };
    },
    onError: (_err, _newProtocol, context) => {
      if (context?.previousPreference) {
        qc.setQueryData(fastingKeys.preference(), context.previousPreference);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.preference() });
    },
  });
}

export function useStartFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartFastingInput = {}) => startFast(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: fastingKeys.active() });
      const previousActive = qc.getQueryData<FastingSessionStatus>(fastingKeys.active());
      const preference = qc.getQueryData<{ protocol: string; fastingHours: number; eatingHours: number }>(fastingKeys.preference());
      
      const targetMinutes = (preference?.fastingHours || 16) * 60;
      qc.setQueryData<FastingSessionStatus>(fastingKeys.active(), {
        sessionId: 'temp-session',
        protocol: (input.protocol || preference?.protocol || '16:8') as FastingProtocol,
        startedAt: input.startedAt || new Date().toISOString(),
        endedAt: null,
        status: 'ACTIVE',
        targetMinutes,
        elapsedMinutes: 0,
        remainingMinutes: targetMinutes,
        progressPercent: 0,
        goalMet: false,
      });

      return { previousActive };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousActive !== undefined) {
        qc.setQueryData(fastingKeys.active(), context.previousActive);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.active() });
      void qc.invalidateQueries({ queryKey: fastingKeys.preference() });
    },
  });
}

export function useUpdateActiveFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { protocol?: string, startedAt?: string }) => updateActiveFast(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: fastingKeys.active() });
      const previousActive = qc.getQueryData<FastingSessionStatus>(fastingKeys.active());
      
      if (previousActive) {
        qc.setQueryData<FastingSessionStatus>(fastingKeys.active(), {
          ...previousActive,
          protocol: (input.protocol as FastingProtocol) ?? previousActive.protocol,
          startedAt: input.startedAt ?? previousActive.startedAt,
        });
      }
      return { previousActive };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousActive !== undefined) {
        qc.setQueryData(fastingKeys.active(), context.previousActive);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.active() });
    },
  });
}

export function useStopFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => stopFast(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: fastingKeys.active() });
      const previousActive = qc.getQueryData<FastingSessionStatus>(fastingKeys.active());
      qc.setQueryData(fastingKeys.active(), null);
      return { previousActive };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousActive !== undefined) {
        qc.setQueryData(fastingKeys.active(), context.previousActive);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.active() });
      void qc.invalidateQueries({ queryKey: fastingKeys.history() });
    },
  });
}

export function useCancelFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelFast(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: fastingKeys.active() });
      const previousActive = qc.getQueryData<FastingSessionStatus>(fastingKeys.active());
      qc.setQueryData(fastingKeys.active(), null);
      return { previousActive };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousActive !== undefined) {
        qc.setQueryData(fastingKeys.active(), context.previousActive);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.active() });
      void qc.invalidateQueries({ queryKey: fastingKeys.history() });
    },
  });
}

export function useUpdatePastSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: { startedAt?: string; endedAt?: string } }) =>
      updateHistoricalFast(sessionId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: fastingKeys.history() });
    },
  });
}
