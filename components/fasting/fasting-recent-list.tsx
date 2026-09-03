import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { FastingSessionRow } from './fasting-session-row';
import type { FastingSessionStatus } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  sessions: FastingSessionStatus[];
  loading?: boolean;
  limit?: number;
  demo?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSeeAll?: () => void;
  onSelectSession?: (session: FastingSessionStatus) => void;
};

export function FastingRecentList({
  sessions,
  loading,
  limit = 5,
  demo,
  error,
  onRetry,
  onSeeAll,
  onSelectSession,
}: Props) {
  const rows = sessions.slice(0, limit);
  const hasMore = sessions.length > limit;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Recent</Text>
          {demo ? <Text style={styles.demoPill}>Demo</Text> : null}
        </View>
        {onSeeAll && (hasMore || sessions.length > 0) ? (
          <Pressable
            onPress={onSeeAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="See all fasting history">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {loading && rows.length === 0 ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : error && rows.length === 0 ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn&apos;t load history</Text>
          <Text style={styles.errorBody}>{error}</Text>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry loading history"
              style={styles.retryHit}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>No past fasts yet</Text>
      ) : (
        <View style={styles.list}>
          {rows.map((session, index) => (
            <FastingSessionRow
              key={session.sessionId}
              session={session}
              showDivider={index > 0}
              onPress={onSelectSession ? () => onSelectSession(session) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.mono,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  demoPill: {
    color: C.primary,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: C.glow,
  },
  seeAll: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
  list: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceLow,
    overflow: 'hidden',
  },
  empty: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
    paddingVertical: 12,
  },
  errorBox: {
    gap: 6,
    paddingVertical: 8,
  },
  errorTitle: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  errorBody: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
  },
  retryHit: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  retryText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
});
