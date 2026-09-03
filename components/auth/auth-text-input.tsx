import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { cn } from '@/lib/cn';

const C = Vital.colors;
const F = Vital.fonts;

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthTextInput({ label, error, className, style, ...rest }: Props) {
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
      <TextInput
        placeholderTextColor={C.outline}
        autoCapitalize="none"
        className={cn('rounded-2xl border px-3.5 py-3.5 text-base', className)}
        style={[
          {
            borderColor: error ? C.error : C.outlineVariant,
            backgroundColor: C.surfaceContainer,
            color: C.onSurface,
            fontFamily: F.sans,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: C.error, fontSize: 13, fontFamily: F.sans, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
