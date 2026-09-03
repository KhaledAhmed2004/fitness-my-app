import { useState } from 'react';
import { router } from 'expo-router';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColors } from '@/hooks/use-theme-colors';

const F = Vital.fonts;

type Props = {
  size?: 'sm' | 'md';
  className?: string;
};

function initialsFromName(name?: string | null) {
  if (!name?.trim()) return 'CT';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || 'CT';
}

export function ProfileAvatarButton({ size = 'md' }: Props) {
  const { user } = useAuth();
  const { isDark, colors } = useThemeColors();
  const [imgError, setImgError] = useState(false);

  const dim = size === 'sm' ? 40 : 46;
  const isTrainer = user?.role === 'TRAINER';
  const avatarUri =
    user?.avatarUrl ||
    (isTrainer
      ? 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80');

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(ROUTES.profile);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={handlePress}
      style={{
        width: dim,
        height: dim,
      }}>
      {/* OUTER CIRCULAR AVATAR CONTAINER */}
      <View
        style={[
          styles.avatarCircle,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: !isDark ? '#FFFFFF' : '#16222f',
            borderColor: !isDark ? '#0E4D34' : '#89FE00',
            shadowColor: !isDark ? '#0E4D34' : '#000000',
            shadowOpacity: !isDark ? 0.16 : 0.4,
          },
        ]}>
        {!imgError && avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
            onError={() => setImgError(true)}
          />
        ) : (
          <Text
            style={[
              styles.initialsText,
              {
                color: !isDark ? '#0E4D34' : '#89FE00',
                fontSize: size === 'sm' ? 13 : 15,
              },
            ]}>
            {initialsFromName(user?.name)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ProfileAvatarWithRing({ size = 'md' }: Props) {
  return <ProfileAvatarButton size={size} />;
}

const styles = StyleSheet.create({
  avatarCircle: {
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontFamily: F.sansBold,
    letterSpacing: 0.4,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
