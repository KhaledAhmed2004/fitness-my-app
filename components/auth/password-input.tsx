import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  error?: string;
};

export function PasswordInput({ label, error, style, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-3.5">
      <Text
        style={{
          color: C.onSurface,
          fontSize: 14,
          fontFamily: F.sansSemiBold,
          marginBottom: 6,
        }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-2xl border pr-3"
        style={{
          borderColor: error ? C.error : C.outlineVariant,
          backgroundColor: C.surfaceContainer,
        }}>
        <TextInput
          placeholderTextColor={C.outline}
          autoCapitalize="none"
          secureTextEntry={!visible}
          className="flex-1 px-3.5 py-3.5 text-base"
          style={[{ color: C.onSurface, fontFamily: F.sans }, style]}
          {...rest}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={C.primary} />
        </Pressable>
      </View>
      {error ? (
        <Text style={{ color: C.error, fontSize: 13, fontFamily: F.sans, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
