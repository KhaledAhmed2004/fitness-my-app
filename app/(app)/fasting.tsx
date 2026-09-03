import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CancelFastSheet } from '@/components/fasting/cancel-fast-sheet';
import { EditFastSheet } from '@/components/fasting/edit-fast-sheet';
import { EditSessionSheet } from '@/components/fasting/edit-session-sheet';
import { announceGoalReached, FastingHero } from '@/components/fasting/fasting-hero';
import { FastingHistorySheet } from '@/components/fasting/fasting-history-sheet';
import { FastingRecentList } from '@/components/fasting/fasting-recent-list';
import { FastingSessionDetailSheet } from '@/components/fasting/fasting-session-detail-sheet';
import { FastingStageCard } from '@/components/fasting/fasting-stage-card';
import { FinishEarlySheet } from '@/components/fasting/finish-early-sheet';
import { ProtocolChips } from '@/components/fasting/protocol-chips';
import { RamadanGuardBannerCard } from '@/components/fasting/ramadan-guard-banner-card';
import { StaleFastModal } from '@/components/fasting/stale-fast-modal';
import { AppScreenHeader } from '@/components/navigation/app-screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { DEMO_FASTING_HISTORY } from '@/constants/demo-fasting-history';
import { Vital } from '@/constants/vital-theme';
import {
  useActiveFast,
  useCancelFast,
  useFastingHistory,
  useFastingPreference,
  useFastingProtocols,
  useInfiniteFastingHistory,
  useSelectProtocol,
  useStartFast,
  useStopFast,
  useUpdateActiveFast,
  useUpdatePastSession,
} from '@/hooks/fasting-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  computeLiveProgress,
  eatingWindowLabel,
  formatClock,
} from '@/lib/fasting-format';
import { fallbackSelectableProtocols } from '@/services/fasting-api';
import type { FastingProtocol, FastingSessionStatus } from '@/types/fasting';
import { useAuth } from '@/hooks/use-auth';
import { TrainerClientsScreenView } from '@/components/trainer/trainer-clients-screen-view';
import { GymMemberDirectoryScreenView } from '@/components/gym-owner';

const C = Vital.colors;
const F = Vital.fonts;

export default function FastingScreen() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER' || (user?.email || '').toLowerCase().includes('trainer');
  const isGymOwner = user?.role === 'GYM_OWNER';

  if (isTrainer) {
    return <TrainerClientsScreenView />;
  }

  if (isGymOwner) {
    return <GymMemberDirectoryScreenView />;
  }

  return <ClientFastingScreenContent />;
}

function ClientFastingScreenContent() {
  const router = useRouter();
  const preferenceQuery = useFastingPreference();
  const activeQuery = useActiveFast();
  const protocolsQuery = useFastingProtocols();
  const selectProtocol = useSelectProtocol();
  const startFast = useStartFast();
  const stopFast = useStopFast();
  const cancelFast = useCancelFast();
  const updateActiveFast = useUpdateActiveFast();
  const updatePastSession = useUpdatePastSession();

  const preference = preferenceQuery.data ?? null;
  const active = activeQuery.data ?? null;
  const protocolPresets = protocolsQuery.data ?? fallbackSelectableProtocols();
  const isLoading = preferenceQuery.isLoading && activeQuery.isLoading;

  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [finishEarlyOpen, setFinishEarlyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<FastingSessionStatus | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Exclude<FastingProtocol, 'CUSTOM'>>(
    '16:8',
  );
  const [editFastVisible, setEditFastVisible] = useState(false);
  const [editFastError, setEditFastError] = useState<string | null>(null);
  const [editSessionVisible, setEditSessionVisible] = useState(false);
  const [editSessionError, setEditSessionError] = useState<string | null>(null);
  const announcedGoal = useRef(false);

  const historyQuery = useFastingHistory(true);
  const infiniteHistoryQuery = useInfiniteFastingHistory(historyOpen);

  const realHistory = historyQuery.data ?? [];
  const usingDemoHistory =
    __DEV__ &&
    !historyQuery.isLoading &&
    !historyQuery.isError &&
    realHistory.length === 0;
  const history = usingDemoHistory ? DEMO_FASTING_HISTORY : realHistory;

  const fullInfiniteHistory = useMemo(() => {
    if (usingDemoHistory) return DEMO_FASTING_HISTORY;
    const pages = infiniteHistoryQuery.data?.pages;
    if (!pages || pages.length === 0) return history;
    const all = pages.flatMap((p) => p.data);
    return all.length > 0 ? all : history;
  }, [usingDemoHistory, infiniteHistoryQuery.data?.pages, history]);

  const coreQueryError =
    (preferenceQuery.isError || activeQuery.isError) && !isLoading;
  const coreQueryErrorMessage = preferenceQuery.isError
    ? getApiErrorMessage(preferenceQuery.error, 'Could not load fasting preferences.')
    : activeQuery.isError
      ? getApiErrorMessage(activeQuery.error, 'Could not load active fast.')
      : null;

  const historyListError =
    historyQuery.isError && realHistory.length === 0 && !usingDemoHistory
      ? getApiErrorMessage(historyQuery.error, 'Check your connection and try again.')
      : null;

  const [manualRefreshing, setManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setManualRefreshing(true);
    await Promise.all([
      preferenceQuery.refetch(),
      activeQuery.refetch(),
      historyQuery.refetch(),
      protocolsQuery.refetch(),
    ]);
    setManualRefreshing(false);
  }, [preferenceQuery, activeQuery, historyQuery, protocolsQuery]);

  useEffect(() => {
    if (!preference) return;
    if (preference.protocol !== 'CUSTOM') {
      setSelectedProtocol(preference.protocol);
    }
  }, [preference]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const live = useMemo(() => {
    if (!active) {
      return { elapsedMinutes: 0, remainingMinutes: 0, progressPercent: 0, goalMet: false };
    }
    return computeLiveProgress(active, now);
  }, [active, now]);

  useEffect(() => {
    if (!active) {
      announcedGoal.current = false;
      return;
    }
    if (live.goalMet && !announcedGoal.current) {
      announcedGoal.current = true;
      announceGoalReached();
    }
  }, [active, live.goalMet]);

  const selectedPreset =
    protocolPresets.find((p) => p.code === selectedProtocol) ??
    fallbackSelectableProtocols().find((p) => p.code === selectedProtocol) ??
    fallbackSelectableProtocols()[0];

  const protocol = active?.protocol ?? selectedProtocol;
  const hours = active
    ? active.targetMinutes / 60
    : preference?.protocol === selectedProtocol
      ? preference.fastingHours
      : selectedPreset.fastingHours;
  const eatingHours = active
    ? Math.max(1, 24 - Math.round(hours))
    : preference?.protocol === selectedProtocol
      ? preference.eatingHours
      : selectedPreset.eatingHours;

  const headerSubtitle = active ? `${protocol} Fast · Active` : 'Ready to fast';

  const metaLine = active
    ? `Started ${formatClock(new Date(active.startedAt))}`
    : null;

  const primaryLabel = !active
    ? 'Start fast'
    : live.goalMet
      ? 'Complete fast'
      : 'Finish early';

  const onSelectProtocol = async (next: Exclude<FastingProtocol, 'CUSTOM'>) => {
    setError(null);
    setSelectedProtocol(next);
  };

  const onStart = async () => {
    setError(null);
    try {
      // Sync the user's default preference if they changed it before starting
      if (preference?.protocol && preference.protocol !== selectedProtocol) {
        selectProtocol.mutate(selectedProtocol);
      }
      await startFast.mutateAsync({ protocol: selectedProtocol });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not start fast.'));
    }
  };

  const doStop = async () => {
    setError(null);
    try {
      await stopFast.mutateAsync();
      setFinishEarlyOpen(false);
    } catch (e) {
      setFinishEarlyOpen(false);
      setError(getApiErrorMessage(e, 'Could not finish fast.'));
    }
  };

  const onEnd = () => {
    if (!active) return;
    if (live.goalMet) {
      void doStop();
      return;
    }
    setFinishEarlyOpen(true);
  };

  const onCancel = () => {
    setError(null);
    setCancelOpen(true);
  };

  const closeCancelSheet = () => {
    setCancelOpen(false);
    setCancelError(null);
  };

  const onConfirmCancel = async () => {
    setCancelError(null);
    try {
      await cancelFast.mutateAsync();
      setCancelOpen(false);
    } catch (e) {
      setCancelError(getApiErrorMessage(e, 'Could not discard fast.'));
    }
  };

  const onStaleSaveAndEdit = async () => {
    try {
      const session = await stopFast.mutateAsync();
      setDetailSession(session);
      setEditSessionVisible(true);
    } catch (e) {
      // Handle error
    }
  };

  const onConfirmEditFast = async (payload: {
    startedAt: string;
    protocol: Exclude<FastingProtocol, 'CUSTOM'>;
  }) => {
    setEditFastError(null);
    try {
      await updateActiveFast.mutateAsync({
        startedAt: payload.startedAt,
        protocol: payload.protocol,
      });
      setEditFastVisible(false);
    } catch (e) {
      setEditFastError(getApiErrorMessage(e, 'Could not update fast.'));
    }
  };

  const openHistory = () => {
    setError(null);
    setHistoryOpen(true);
  };

  const openSessionDetail = (session: FastingSessionStatus) => {
    setHistoryOpen(false);
    setDetailSession(session);
  };

  const closeSessionDetail = () => {
    setDetailSession(null);
  };

  const onConfirmEditSession = async (startedAt: string, endedAt: string) => {
    if (!detailSession) return;
    setEditSessionError(null);
    try {
      await updatePastSession.mutateAsync({
        sessionId: detailSession.sessionId,
        input: { startedAt, endedAt },
      });
      setEditSessionVisible(false);
      setDetailSession(null);
    } catch (e) {
      setEditSessionError(getApiErrorMessage(e, 'Could not update session.'));
    }
  };

  return (
    <AppScreen>
      <AppScreenHeader
        title="Fasting"
        subtitle={headerSubtitle}
        onBack={() => router.back()}
        rightAction={
          active ? (
            <Pressable
              onPress={openHistory}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="View fasting history"
              style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.75 }]}>
              <View style={styles.headerIconFace}>
                <MaterialIcons name="history" size={22} color="#e0e3e6" />
              </View>
            </Pressable>
          ) : null
        }
      />

      {isLoading && !preference && !active ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, !active && styles.contentIdle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }>
          {coreQueryError && coreQueryErrorMessage ? (
            <View style={styles.queryErrorBox}>
              <Text style={styles.queryErrorTitle}>Couldn&apos;t load fasting</Text>
              <Text style={styles.queryErrorBody}>{coreQueryErrorMessage}</Text>
              <Pressable
                onPress={onRefresh}
                accessibilityRole="button"
                accessibilityLabel="Retry loading fasting"
                style={styles.retryHit}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
          {live.elapsedMinutes > 4320 ? (
            <View style={{ marginTop: 24, marginBottom: 40 }}>
              <StaleFastModal
                elapsedHours={live.elapsedMinutes / 60}
                onDiscard={onCancel}
                onSaveAndEdit={onStaleSaveAndEdit}
                isDiscarding={cancelFast.isPending}
                isSaving={stopFast.isPending}
              />
            </View>
          ) : (
            <>
              <FastingHero
                mode={active ? 'active' : 'idle'}
                progressPercent={live.progressPercent}
                remainingMinutes={live.remainingMinutes}
                elapsedMinutes={live.elapsedMinutes}
                goalMet={live.goalMet}
                protocolLabel={protocol}
                idleHours={hours}
                idleEatingHours={eatingHours}
                startTimeLabel={
                  active ? formatClock(new Date(active.startedAt)) : null
                }
                targetEndTime={
                  active
                    ? formatClock(
                        new Date(new Date(active.startedAt).getTime() + hours * 60 * 60 * 1000),
                      )
                    : null
                }
                onEditFast={active ? () => setEditFastVisible(true) : undefined}
              />

              {active ? (
                <>
                  <FastingStageCard elapsedMinutes={live.elapsedMinutes} />

                  <PrimaryButton
                    label={primaryLabel}
                    onPress={onEnd}
                    loading={stopFast.isPending}
                  />

                  <Pressable
                    onPress={onCancel}
                    disabled={cancelFast.isPending || stopFast.isPending}
                    hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                    accessibilityRole="button"
                    accessibilityLabel="Discard fast"
                    style={({ pressed }) => [styles.cancelHit, pressed && { opacity: 0.7 }]}>
                    <View style={styles.cancelInner}>
                      <MaterialIcons name="close" size={15} color={C.onSurfaceVariant} />
                      <Text style={styles.cancelText}>Discard fast</Text>
                    </View>
                  </Pressable>
                </>
              ) : (
                <>
                  <ProtocolChips
                    protocols={protocolPresets}
                    selected={selectedProtocol}
                    disabled={selectProtocol.isPending}
                    onSelect={onSelectProtocol}
                  />

                  <PrimaryButton
                    label={primaryLabel}
                    onPress={onStart}
                    loading={startFast.isPending}
                  />
                </>
              )}
            </>
          )}

          <RamadanGuardBannerCard />

          {!active ? (
            <FastingRecentList
              sessions={history}
              loading={historyQuery.isLoading}
              limit={2}
              demo={usingDemoHistory}
              error={historyListError}
              onRetry={() => void historyQuery.refetch()}
              onSeeAll={openHistory}
              onSelectSession={openSessionDetail}
            />
          ) : null}
        </ScrollView>
      )}

      <CancelFastSheet
        visible={cancelOpen}
        loading={cancelFast.isPending}
        error={cancelError}
        onClose={closeCancelSheet}
        onConfirm={onConfirmCancel}
      />

      <FinishEarlySheet
        visible={finishEarlyOpen}
        loading={stopFast.isPending}
        onClose={() => setFinishEarlyOpen(false)}
        onConfirm={() => void doStop()}
      />

      <FastingHistorySheet
        visible={historyOpen}
        sessions={fullInfiniteHistory}
        hasNextPage={infiniteHistoryQuery.hasNextPage}
        isFetchingNextPage={infiniteHistoryQuery.isFetchingNextPage}
        onFetchNextPage={() => void infiniteHistoryQuery.fetchNextPage()}
        onClose={() => setHistoryOpen(false)}
        onSelectSession={openSessionDetail}
      />

      <EditFastSheet
        visible={editFastVisible}
        initialTime={active?.startedAt ?? null}
        currentProtocol={protocol}
        protocols={protocolPresets}
        loading={updateActiveFast.isPending}
        error={editFastError}
        onClose={() => {
          setEditFastVisible(false);
          setEditFastError(null);
        }}
        onConfirm={onConfirmEditFast}
      />

      <FastingSessionDetailSheet
        visible={!!detailSession && !editSessionVisible}
        session={detailSession}
        onClose={closeSessionDetail}
        onEditRequest={() => setEditSessionVisible(true)}
      />

      <EditSessionSheet
        visible={editSessionVisible}
        session={detailSession}
        loading={updatePastSession.isPending}
        error={editSessionError}
        onClose={() => {
          setEditSessionVisible(false);
          setEditSessionError(null);
        }}
        onConfirm={onConfirmEditSession}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 44,
    paddingTop: 8,
  },
  contentIdle: {
    gap: 14,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 112,
  },
  queryErrorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  queryErrorTitle: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  queryErrorBody: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
  },
  retryHit: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  retryText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  cancelHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    alignSelf: 'center',
  },
  cancelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sansMedium,
  },
  headerIconBtn: {},
  headerIconFace: {
    height: 40,
    width: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
  },
});
