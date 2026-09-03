import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import type { WaterLogEntry } from '@/types/hydration';
import { HydrationHistoryModal } from './hydration-history-modal';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  logs: WaterLogEntry[];
  busy?: boolean;
  onDelete: (logId: string) => void;
};

/**
 * MENTOR: Compact history button that opens the full log modal.
 */
export function HydrationLogsList({ logs, busy, onDelete }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  if (!logs.length) return null;

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="View hydration history"
        style={({ pressed }) => [pressed && styles.historyBtnPressed]}
      >
        <View style={styles.historyBtn}>
          <MaterialIcons name="history" size={16} color={C.primary} />
          <Text style={styles.historyBtnText}>History ({logs.length})</Text>
        </View>
      </Pressable>

      <HydrationHistoryModal
        visible={modalVisible}
        logs={logs}
        busy={busy}
        onClose={() => setModalVisible(false)}
        onDelete={onDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.glassFill,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  historyBtnPressed: {
    opacity: 0.7,
  },
  historyBtnText: {
    color: C.onSurface,
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
});
