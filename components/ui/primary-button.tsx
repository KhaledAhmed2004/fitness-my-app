import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';

const F = Vital.fonts;

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

/**
 * MENTOR: Do not put backgroundColor on Pressable when NativeWind jsxImportSource
 * is enabled — it often drops the fill. Paint an inner View instead (full width).
 */
export function PrimaryButton({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.pressable,
        (pressed || isDisabled) && { opacity: 0.85 },
      ]}>
      <View
        className={
          isPrimary
            ? 'min-h-[56px] w-full items-center justify-center rounded-full bg-[#00b4ff] px-5'
            : 'min-h-[56px] w-full items-center justify-center rounded-full border-[1.5px] border-[#89ceff] px-5'
        }
        style={isPrimary ? styles.facePrimary : styles.faceGhost}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#00344d' : '#89ceff'} />
        ) : (
          <Text style={isPrimary ? styles.labelPrimary : styles.labelGhost}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    width: '100%',
  },
  facePrimary: {
    minHeight: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
    backgroundColor: '#00b4ff',
  },
  faceGhost: {
    minHeight: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(137,206,255,0.08)',
    borderWidth: 1.5,
    borderColor: '#89ceff',
  },
  labelPrimary: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: '#00344d',
    letterSpacing: 0.2,
  },
  labelGhost: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: '#89ceff',
    letterSpacing: 0.2,
  },
});
