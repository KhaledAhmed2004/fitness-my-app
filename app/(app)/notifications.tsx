import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  useNotificationStore,
  type AppNotification,
  type NotificationCategory,
  type NotificationDateGroup,
} from '@/stores/notification-store';

const C = Vital.colors;
const F = Vital.fonts;

export type FilterKey = 'ALL' | 'UNREAD' | NotificationCategory;

interface FilterConfig {
  key: FilterKey;
  label: string;
  icon: any;
  isUnread?: boolean;
}

const FILTER_ITEMS: FilterConfig[] = [
  { key: 'ALL', label: 'All', icon: 'auto-awesome' },
  { key: 'UNREAD', label: 'Unread', icon: 'mark-email-unread', isUnread: true },
  { key: 'COACHING', label: 'Coaching', icon: 'sports' },
  { key: 'TRAINING', label: 'Workouts', icon: 'fitness-center' },
  { key: 'NUTRITION', label: 'Nutrition', icon: 'restaurant' },
  { key: 'FASTING', label: 'Fasting', icon: 'timer' },
];

const DATE_GROUP_LABELS: Record<NotificationDateGroup, string> = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  EARLIER: 'Earlier',
};

function SwipeableNotificationItem({
  item,
  isDark,
  cardShadow,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  isDark: boolean;
  cardShadow: any;
  onPress: () => void;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-80, -30, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
        style={styles.swipeDeleteAction}>
        <Animated.View style={[styles.swipeDeleteInner, { transform: [{ scale }], opacity }]}>
          <MaterialIcons name="delete-outline" size={22} color="#FFFFFF" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={45}
      friction={1.8}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }}
      containerStyle={styles.swipeableContainer}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[
          styles.notificationCard,
          !isDark
            ? {
                backgroundColor: '#FFFFFF',
                borderColor: !item.isRead
                  ? 'rgba(14, 77, 52, 0.28)'
                  : 'rgba(14, 77, 52, 0.08)',
                ...cardShadow,
              }
            : {
                backgroundColor: !item.isRead
                  ? 'rgba(137, 254, 0, 0.05)'
                  : C.surfaceContainer,
                borderColor: !item.isRead
                  ? 'rgba(137, 254, 0, 0.3)'
                  : C.glassBorder,
              },
        ]}>
        {/* ICON BADGE */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: !isDark
                ? item.badgeBg
                : 'rgba(255, 255, 255, 0.08)',
            },
          ]}>
          <MaterialIcons
            name={item.icon as any}
            size={20}
            color={!isDark ? item.accentColor : '#89FE00'}
          />
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.cardHeaderRow}>
            <Text
              style={[
                styles.cardTitle,
                !isDark ? { color: '#0E4D34' } : { color: C.onSurface },
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && (
              <View
                style={[
                  styles.unreadDot,
                  !isDark
                    ? { backgroundColor: '#0E4D34' }
                    : { backgroundColor: '#89FE00' },
                ]}
              />
            )}
          </View>

          <Text
            style={[
              styles.cardMessage,
              !isDark ? { color: '#4A6956' } : { color: C.onSurfaceVariant },
            ]}>
            {item.message}
          </Text>

          <View style={styles.cardFooterRow}>
            <Text
              style={[
                styles.cardTimestamp,
                !isDark ? { color: '#7E9A86' } : { color: C.onSurfaceVariant },
              ]}>
              {item.timestamp}
            </Text>

            {item.actionLabel && (
              <Text
                style={[
                  styles.cardActionText,
                  !isDark ? { color: '#007A99' } : { color: '#00B4D8' },
                ]}>
                {item.actionLabel}
              </Text>
            )}
          </View>
        </View>

        {/* DISMISS BUTTON */}
        <TouchableOpacity
          hitSlop={8}
          activeOpacity={0.7}
          onPress={onDelete}
          style={styles.dismissBtn}>
          <MaterialIcons
            name="close"
            size={14}
            color={!isDark ? '#7E9A86' : 'rgba(255, 255, 255, 0.3)'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function NotificationsScreen() {
  const { isDark, colors } = useThemeColors();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('ALL');
  const [clearModalVisible, setClearModalVisible] = useState(false);

  // 1. Dynamic Counts for each filter
  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      ALL: notifications.length,
      UNREAD: unreadCount,
      COACHING: 0,
      TRAINING: 0,
      NUTRITION: 0,
      FASTING: 0,
      SYSTEM: 0,
    };
    notifications.forEach((n) => {
      if (counts[n.category] !== undefined) {
        counts[n.category] += 1;
      }
    });
    return counts;
  }, [notifications, unreadCount]);

  // 2. Filter list
  const filteredList = useMemo(() => {
    if (selectedFilter === 'ALL') return notifications;
    if (selectedFilter === 'UNREAD') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.category === selectedFilter);
  }, [notifications, selectedFilter]);

  // 3. Group by Date
  const groupedSections = useMemo(() => {
    const groups: { groupKey: NotificationDateGroup; title: string; items: AppNotification[] }[] = [];
    const order: NotificationDateGroup[] = ['TODAY', 'YESTERDAY', 'EARLIER'];

    order.forEach((gKey) => {
      const items = filteredList.filter((n) => n.dateGroup === gKey);
      if (items.length > 0) {
        groups.push({
          groupKey: gKey,
          title: DATE_GROUP_LABELS[gKey],
          items,
        });
      }
    });

    return groups;
  }, [filteredList]);

  const handleCardPress = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.actionRoute) {
      router.push(notif.actionRoute as any);
    }
  };

  const handleOpenClearModal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setClearModalVisible(true);
  };

  const handleConfirmClearAll = () => {
    clearAll();
    setClearModalVisible(false);
  };

  const cardShadow = !isDark
    ? {
        shadowColor: '#0E4D34',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }
    : {};

  return (
    <AppScreen style={styles.screen}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.15)',
                }
              : {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
          ]}>
          <MaterialIcons
            name="arrow-back-ios-new"
            size={16}
            color={!isDark ? '#0E4D34' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadgePill,
                !isDark
                  ? { backgroundColor: '#0E4D34' }
                  : { backgroundColor: '#89FE00' },
              ]}>
              <Text
                style={[
                  styles.unreadBadgeText,
                  !isDark ? { color: '#FFFFFF' } : { color: '#002233' },
                ]}>
                {unreadCount} New
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={unreadCount > 0 ? 0.75 : 1}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            disabled={unreadCount === 0}
            onPress={markAllAsRead}
            style={[
              styles.headerActionBtn,
              !isDark
                ? {
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(14, 77, 52, 0.15)',
                    borderWidth: 1,
                    opacity: unreadCount > 0 ? 1 : 0.4,
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    opacity: unreadCount > 0 ? 1 : 0.3,
                  },
            ]}>
            <MaterialIcons
              name="done-all"
              size={17}
              color={
                unreadCount > 0
                  ? !isDark
                    ? '#0E4D34'
                    : '#89FE00'
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>

          {notifications.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Clear all"
              onPress={handleOpenClearModal}
              style={[
                styles.headerActionBtn,
                !isDark
                  ? {
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(14, 77, 52, 0.15)',
                      borderWidth: 1,
                    }
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 1,
                    },
              ]}>
              <MaterialIcons
                name="delete-sweep"
                size={18}
                color={!isDark ? '#DC2626' : '#FF5C5C'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. UNIFIED SINGLE-ROW FILTER BAR WITH LIVE COUNTS */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}>
          {FILTER_ITEMS.map((item) => {
            const isSelected = selectedFilter === item.key;
            const count = filterCounts[item.key] || 0;

            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedFilter(item.key);
                }}
                style={[
                  styles.categoryChip,
                  isSelected
                    ? !isDark
                      ? { backgroundColor: '#0E4D34', borderColor: '#0E4D34' }
                      : { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                    : !isDark
                    ? { backgroundColor: '#FFFFFF', borderColor: 'rgba(14, 77, 52, 0.15)' }
                    : { backgroundColor: C.surfaceContainer, borderColor: C.glassBorder },
                ]}>
                <MaterialIcons
                  name={item.icon}
                  size={14}
                  color={
                    isSelected
                      ? !isDark
                        ? '#FFFFFF'
                        : '#002233'
                      : item.isUnread && unreadCount > 0
                      ? !isDark
                        ? '#0E4D34'
                        : '#89FE00'
                      : !isDark
                      ? '#0E4D34'
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected
                        ? !isDark
                          ? '#FFFFFF'
                          : '#002233'
                        : !isDark
                        ? '#0E4D34'
                        : colors.textSecondary,
                    },
                  ]}>
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.chipCountBadge,
                    isSelected
                      ? !isDark
                        ? { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                        : { backgroundColor: 'rgba(0, 34, 51, 0.25)' }
                      : item.isUnread && unreadCount > 0
                      ? !isDark
                        ? { backgroundColor: '#B4E876' }
                        : { backgroundColor: 'rgba(137, 254, 0, 0.2)' }
                      : !isDark
                      ? { backgroundColor: '#E7F3DD' }
                      : { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  ]}>
                  <Text
                    style={[
                      styles.chipCountText,
                      {
                        color: isSelected
                          ? !isDark
                            ? '#FFFFFF'
                            : '#002233'
                          : item.isUnread && unreadCount > 0
                          ? !isDark
                            ? '#0E4D34'
                            : '#89FE00'
                          : !isDark
                          ? '#0E4D34'
                          : colors.textSecondary,
                      },
                    ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. NOTIFICATIONS FEED LIST GROUPED BY DATE */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}>
        {groupedSections.length > 0 ? (
          <View style={{ gap: 20 }}>
            {groupedSections.map((section) => (
              <View key={section.groupKey} style={{ gap: 10 }}>
                {/* SECTION HEADER */}
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      styles.sectionHeaderText,
                      !isDark ? { color: '#0E4D34' } : { color: colors.textSecondary },
                    ]}>
                    {section.title}
                  </Text>
                  <View
                    style={[
                      styles.sectionHeaderLine,
                      !isDark
                        ? { backgroundColor: 'rgba(14, 77, 52, 0.12)' }
                        : { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.sectionHeaderCount,
                      !isDark ? { color: '#7E9A86' } : { color: C.onSurfaceVariant },
                    ]}>
                    {section.items.length} {section.items.length === 1 ? 'alert' : 'alerts'}
                  </Text>
                </View>

                {/* SECTION ITEMS */}
                <View style={{ gap: 10 }}>
                  {section.items.map((item) => (
                    <SwipeableNotificationItem
                      key={item.id}
                      item={item}
                      isDark={isDark}
                      cardShadow={cardShadow}
                      onPress={() => handleCardPress(item)}
                      onDelete={() => deleteNotification(item.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* EMPTY STATE */
          <View style={styles.emptyStateContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                !isDark
                  ? { backgroundColor: '#E7F3DD' }
                  : { backgroundColor: 'rgba(137, 254, 0, 0.1)' },
              ]}>
              <MaterialIcons
                name={selectedFilter === 'UNREAD' ? 'mark-email-read' : 'notifications-none'}
                size={40}
                color={!isDark ? '#0E4D34' : '#89FE00'}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                !isDark ? { color: '#0E4D34' } : { color: C.onSurface },
              ]}>
              {selectedFilter === 'UNREAD'
                ? 'No Unread Notifications'
                : "You're All Caught Up!"}
            </Text>
            <Text
              style={[
                styles.emptySub,
                !isDark ? { color: '#4A6956' } : { color: C.onSurfaceVariant },
              ]}>
              {selectedFilter === 'UNREAD'
                ? 'You have read all notifications. Switch to All to review past updates.'
                : 'No alerts or workout reminders found for this filter. Check back later.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 4. CUSTOM ATTACHED CONFIRMATION MODAL FOR CLEAR ALL */}
      <Modal
        visible={clearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              !isDark
                ? {
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(14, 77, 52, 0.15)',
                    shadowColor: '#0E4D34',
                    shadowOpacity: 0.18,
                    shadowRadius: 20,
                    elevation: 8,
                  }
                : {
                    backgroundColor: '#161D24',
                    borderColor: 'rgba(255, 92, 92, 0.35)',
                  },
            ]}>
            {/* ICON EMBLEM */}
            <View
              style={[
                styles.modalIconWrap,
                !isDark
                  ? { backgroundColor: '#FEE2E2' }
                  : { backgroundColor: 'rgba(255, 92, 92, 0.15)' },
              ]}>
              <MaterialIcons
                name="delete-sweep"
                size={32}
                color={!isDark ? '#DC2626' : '#FF5C5C'}
              />
            </View>

            {/* TITLE & SUBTITLE */}
            <Text
              style={[
                styles.modalPromptTitle,
                !isDark ? { color: '#0E4D34' } : { color: '#FFFFFF' },
              ]}>
              Clear All Notifications?
            </Text>
            <Text
              style={[
                styles.modalPromptSub,
                !isDark ? { color: '#4A6956' } : { color: C.onSurfaceVariant },
              ]}>
              All alerts, workout nudges, and coaching updates will be permanently removed from your inbox.
            </Text>

            {/* ACTION BUTTONS */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setClearModalVisible(false)}
                style={[
                  styles.cancelBtn,
                  !isDark
                    ? {
                        backgroundColor: '#F0F5EC',
                        borderColor: 'rgba(14, 77, 52, 0.12)',
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                ]}>
                <Text
                  style={[
                    styles.cancelBtnText,
                    !isDark ? { color: '#0E4D34' } : { color: '#FFFFFF' },
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmClearAll}
                style={[
                  styles.confirmDeleteBtn,
                  !isDark
                    ? { backgroundColor: '#DC2626' }
                    : { backgroundColor: '#FF5C5C' },
                ]}>
                <Text style={styles.confirmDeleteBtnText}>Yes, Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  unreadBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // UNIFIED FILTER CHIPS BAR
  categoryScrollWrap: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontFamily: F.sansMedium,
  },
  chipCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  chipCountText: {
    fontSize: 10.5,
    fontFamily: F.mono,
  },

  // FEED LIST & SECTIONS
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
  },
  sectionHeaderCount: {
    fontSize: 11,
    fontFamily: F.mono,
  },

  // CARD ITEM
  swipeableContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  swipeDeleteAction: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 18,
    marginLeft: 8,
  },
  swipeDeleteInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cardMessage: {
    fontSize: 12.5,
    fontFamily: F.sans,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardTimestamp: {
    fontSize: 11,
    fontFamily: F.mono,
  },
  cardActionText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  dismissBtn: {
    padding: 4,
  },

  // EMPTY STATE
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: F.sansBold,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 19,
  },

  // MODAL CONFIRMATION
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalPromptTitle: {
    fontSize: 18,
    fontFamily: F.sansBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalPromptSub: {
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  confirmDeleteBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
});
