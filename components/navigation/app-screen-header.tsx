import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';

import { ProfileAvatarButton } from '@/components/navigation/profile-avatar-button';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

const F = Vital.fonts;

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

/**
 * AppScreenHeader — Premium unified header with glass icon buttons,
 * optional title icon badge, and clean typography.
 */
export function AppScreenHeader({
  title,
  subtitle,
  icon,
  iconColor,
  onBack,
  rightAction,
  containerStyle,
  titleStyle,
  subtitleStyle,
}: Props) {
  const { colors, isDark } = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.background }, containerStyle]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backHit}>
          <View style={[styles.backFace, { backgroundColor: colors.glassFill, borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </View>
        </Pressable>
      ) : null}
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          {icon ? (
            <View
              style={[
                styles.titleIconBox,
                iconColor
                  ? {
                      borderColor: `${iconColor}45`,
                      backgroundColor: `${iconColor}18`,
                    }
                  : {
                      borderColor: colors.border,
                      backgroundColor: colors.glassFill,
                    },
              ]}>
              <MaterialIcons name={icon} size={15} color={iconColor || colors.primary} />
            </View>
          ) : null}
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.title, { color: colors.textPrimary }, titleStyle]}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }, subtitleStyle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightGroup}>
        {rightAction}
        <ProfileAvatarButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
  },
  backHit: {},
  backFace: {
    height: 38,
    width: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  titleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 23,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: F.sansMedium,
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
