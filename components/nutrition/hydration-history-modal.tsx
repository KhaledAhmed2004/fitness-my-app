import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import type { WaterLogEntry } from '@/types/hydration';

const C = Vital.colors;
const F = Vital.fonts;

const PRESET_LABEL: Record<string, string> = {
  GLASS: 'Glass',
  BOTTLE: 'Bottle',
  LARGE: 'Large',
};

type Props = {
  visible: boolean;
  logs: WaterLogEntry[];
  busy?: boolean;
  onClose: () => void;
  onDelete: (logId: string) => void;
};

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function HydrationHistoryModal({ visible, logs, busy, onClose, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const ordered = [...logs].reverse();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.listWrap, ordered.length === 0 && { borderWidth: 0, backgroundColor: 'transparent' }]}>
              {ordered.length > 0 ? (
                ordered.map((log, index) => {
                  const preset = log.preset ? PRESET_LABEL[log.preset] : null;
                  const label = preset
                    ? `${preset} · ${Math.round(log.amountMl)} ml`
                    : `${Math.round(log.amountMl)} ml`;
                  const time = formatTime(log.createdAt);
                  
                  const isFirst = index === 0;

                  return (
                    <View key={log.id} style={[styles.row, isFirst && styles.rowFirst]}>
                      <View style={styles.copy}>
                        <Text style={styles.rowTitle}>{label}</Text>
                        {time ? <Text style={styles.meta}>{time}</Text> : null}
                      </View>
                      <Pressable
                        disabled={busy || !log.id}
                        onPress={() => onDelete(log.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${Math.round(log.amountMl)} milliliters`}
                        accessibilityState={{ disabled: !!busy }}
                        style={({ pressed }) => [styles.deleteHit, (pressed || busy) && { opacity: 0.5 }]}>
                        <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <MaterialIcons name="history-toggle-off" size={36} color={C.outlineVariant} style={{ marginBottom: 12 }} />
                  <Text style={{ color: C.onSurfaceVariant, fontSize: 15, fontFamily: F.sans }}>
                    No hydration history today.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glassFill,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceLow,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.glassFill,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
  },
  meta: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  deleteHit: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
