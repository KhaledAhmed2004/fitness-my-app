/**
 * MENTOR: Shared auth chrome uses NativeWind className.
 * SafeArea stays on the screen shell — not the root layout.
 */

import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  className?: string;
};

export function AuthScreen({ children, className }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-surface-muted" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName={cn(
            'flex-grow justify-center px-6 py-8',
            className,
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-[420px] self-center">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
