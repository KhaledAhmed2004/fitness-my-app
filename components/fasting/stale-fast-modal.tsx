import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  elapsedHours: number;
  onDiscard: () => void;
  onSaveAndEdit: () => void;
  isDiscarding: boolean;
  isSaving: boolean;
};

export function StaleFastModal({
  elapsedHours,
  onDiscard,
  onSaveAndEdit,
  isDiscarding,
  isSaving,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="timer-off" size={48} color="#FF9F43" />
      </View>
      <Text style={styles.title}>You&apos;ve been fasting for over {Math.floor(elapsedHours)} hours!</Text>
      <Text style={styles.subtitle}>
        It looks like you might have forgotten to stop your timer. What would you like to do with this session?
      </Text>

      <View style={styles.actions}>
        <PrimaryButton
          label="Stop Fast & Edit Time"
          onPress={onSaveAndEdit}
          loading={isSaving}
          disabled={isDiscarding}
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="Discard Session"
          variant="ghost"
          onPress={onDiscard}
          loading={isDiscarding}
          disabled={isSaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  title: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: F.sansBold,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 15,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
  },
  gap: {
    height: 12,
  },
});
