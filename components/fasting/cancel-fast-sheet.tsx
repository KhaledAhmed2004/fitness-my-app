import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * MENTOR: Discard is destructive (no completion credit) — confirm before API cancel.
 */
export function CancelFastSheet({ visible, loading, error, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Discard this fast?</Text>
          <Text style={styles.body}>
            It won&apos;t count as completed. You can start a new fast anytime.
          </Text>
          <PrimaryButton label="Keep fasting" onPress={onClose} disabled={loading} />
          <View style={styles.gap} />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            label="Discard fast"
            variant="ghost"
            onPress={onConfirm}
            loading={loading}
          />
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
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 16,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    marginBottom: 8,
  },
  body: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
    lineHeight: 20,
    marginBottom: 20,
  },
  gap: { height: 10 },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 10,
  },
});
