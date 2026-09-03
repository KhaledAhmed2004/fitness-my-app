import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputKeyPressEventData,
  type NativeSyntheticEvent,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const OTP_LENGTH = 6;

type Props = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * MENTOR: Industry OTP UX — digit cells + one hidden input for paste / SMS autofill.
 * (Banking / Stripe / Apple-style verify screens.)
 */
export function OtpCodeInput({ value, onChange, onComplete, error, disabled }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
  const activeIndex = Math.min(digits.length, OTP_LENGTH - 1);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const setCode = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(clean);
    if (clean.length === OTP_LENGTH) {
      onComplete?.(clean);
    }
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && value.length > 0) {
      // TextInput already handles delete; keep for clarity on Android edge cases
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter verification code"
        disabled={disabled}
        onPress={() => inputRef.current?.focus()}
        style={styles.row}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const char = digits[i] ?? '';
          const isActive = focused && i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isActive && styles.cellActive,
                !!error && styles.cellError,
                !!char && styles.cellFilled,
              ]}>
              <Text style={styles.digit}>{char}</Text>
              {isActive && !char ? <View style={styles.caret} /> : null}
            </View>
          );
        })}
      </Pressable>

      {/* Invisible input captures typing, paste, and iOS SMS one-time-code */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setCode}
        onKeyPress={onKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill="yes"
        maxLength={OTP_LENGTH}
        caretHidden
        editable={!disabled}
        style={styles.hiddenInput}
        accessibilityLabel="OTP input"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const OTP_CODE_LENGTH = OTP_LENGTH;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: 'rgba(137,206,255,0.35)',
  },
  cellActive: {
    borderColor: C.primaryContainer,
    backgroundColor: C.surfaceHigh,
    shadowColor: C.primaryContainer,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cellError: {
    borderColor: C.error,
  },
  digit: {
    color: C.onSurface,
    fontSize: 24,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  caret: {
    width: 2,
    height: 22,
    borderRadius: 1,
    backgroundColor: C.primaryContainer,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 10,
    textAlign: 'center',
  },
});
