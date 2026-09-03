import React, { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import {
  fastingHistoryOutcome,
  fastingHistoryOutcomeLabel,
  formatClock,
  formatDurationMinutes,
  formatRelativeDay,
} from '@/lib/fasting-format';
import type { FastingSessionStatus } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  session: FastingSessionStatus | null;
  onClose: () => void;
  onEditRequest?: () => void;
};

/** Format date string nicely for detail rows (e.g., "Aug 15 · 8:30 PM") */
function formatDateTimeLabel(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = formatClock(d);
  return `${dateStr} · ${timeStr}`;
}

export function FastingSessionDetailSheet({
  visible,
  session,
  onClose,
  onEditRequest,
}: Props) {
  const insets = useSafeAreaInsets();
  const [held, setHeld] = useState<FastingSessionStatus | null>(session);

  useEffect(() => {
    if (session) setHeld(session);
  }, [session]);

  const display = session ?? held;
  if (!display) return null;

  const outcome = fastingHistoryOutcome(display);
  const success = outcome !== 'early';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, success ? styles.iconOk : styles.iconEarly]}>
              <MaterialIcons
                name={success ? 'check' : 'close'}
                size={22}
                color={success ? C.onSecondaryContainer : C.surfaceLowest}
              />
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.day}>{formatRelativeDay(display.startedAt)}</Text>
              <View style={styles.outcomeRow}>
                <Text
                  style={[
                    styles.outcome,
                    success ? styles.outcomeSuccess : styles.outcomeEarly,
                  ]}>
                  {fastingHistoryOutcomeLabel(outcome)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeFace, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Main Duration Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>TOTAL FAST DURATION</Text>
            <Text style={styles.heroValue}>
              {formatDurationMinutes(display.elapsedMinutes)}
            </Text>
            <Text style={styles.heroTarget}>
              Goal: {Math.round(display.targetMinutes / 60)} hours ({display.protocol})
            </Text>
          </View>

          {/* Data Rows Container */}
          <View style={styles.rowsCard}>
            <DetailRow
              icon="play-circle-outline"
              label="Started"
              value={formatDateTimeLabel(display.startedAt)}
            />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="stop-circle"
              label="Ended"
              value={formatDateTimeLabel(display.endedAt)}
            />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="tune"
              label="Protocol"
              value={`${display.protocol} Fast`}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onEditRequest ? (
              <PrimaryButton
                label="Edit Fast Times"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEditRequest();
                }}
              />
            ) : null}
            <View style={{ height: 8 }} />
            <PrimaryButton
              label="Close"
              variant="ghost"
              onPress={() => {
                void Haptics.selectionAsync();
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={16} color={C.onSurfaceVariant} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOk: {
    backgroundColor: C.secondaryContainer,
  },
  iconEarly: {
    backgroundColor: C.error,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  day: {
    color: C.onSurface,
    fontSize: 18,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  outcomeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  outcome: {
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  outcomeSuccess: {
    color: C.secondary,
  },
  outcomeEarly: {
    color: C.error,
  },
  closeFace: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  heroCard: {
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroValue: {
    color: C.onSurface,
    fontSize: 28,
    fontFamily: F.sansBold,
    letterSpacing: -0.5,
  },
  heroTarget: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansMedium,
    marginTop: 4,
  },
  rowsCard: {
    backgroundColor: C.surfaceLow,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sansMedium,
  },
  rowValue: {
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.glassBorder,
  },
  actions: {
    gap: 4,
  },
});
