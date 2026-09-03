import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface DeviceSession {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet';
  client: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const INITIAL_SESSIONS: DeviceSession[] = [
  {
    id: 's-1',
    name: 'Pixel 8 Pro',
    type: 'phone',
    client: 'TrackMe Native (Build 2026.08)',
    location: 'Dhaka, Bangladesh',
    lastActive: 'Active Now',
    isCurrent: true,
  },
  {
    id: 's-2',
    name: 'MacBook Pro 16"',
    type: 'laptop',
    client: 'Chrome 128 (Web Companion)',
    location: 'San Francisco, United States',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 's-3',
    name: 'iPad Air (5th Gen)',
    type: 'tablet',
    client: 'Safari 17.4 (Tablet Dashboard)',
    location: 'London, United Kingdom',
    lastActive: 'Yesterday at 8:40 PM',
    isCurrent: false,
  },
];

const AUTO_LOCK_OPTIONS = [
  { id: 'immediately', label: 'Immediately upon exit', desc: 'Lock the app the moment it is backgrounded' },
  { id: '1m', label: 'After 1 minute', desc: 'Allow brief app-switching without re-authenticating' },
  { id: '5m', label: 'After 5 minutes', desc: 'Balanced security & convenience' },
  { id: '15m', label: 'After 15 minutes', desc: 'Longer timeout for workout sessions' },
];

export default function SecuritySessionsScreen() {
  // Security Toggles
  const [biometricUnlock, setBiometricUnlock] = useState(true);
  const [screenPrivacyGuard, setScreenPrivacyGuard] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [autoLockTimeout, setAutoLockTimeout] = useState('1m');

  // Sessions State
  const [sessions, setSessions] = useState<DeviceSession[]>(INITIAL_SESSIONS);

  // Modals
  const [autoLockModalVisible, setAutoLockModalVisible] = useState(false);
  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [wipeDbModalVisible, setWipeDbModalVisible] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleBiometrics = (val: boolean) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setBiometricUnlock(val);
    triggerToast(val ? 'Biometric authentication (Face ID/Fingerprint) enabled.' : 'Biometric unlock disabled.');
  };

  const handleTogglePrivacyGuard = (val: boolean) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setScreenPrivacyGuard(val);
    triggerToast(val ? 'App Switcher privacy mask active.' : 'App Switcher preview enabled.');
  };

  const handleToggle2FA = (val: boolean) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setTwoFactorAuth(val);
    triggerToast(val ? 'Two-Factor Authentication (TOTP) activated.' : '2FA disabled.');
  };

  const handleTerminateOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setTerminateModalVisible(false);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    triggerToast('All other remote device sessions terminated successfully.');
  };

  const handleChangePasswordSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Security Requirement', 'New password must be at least 6 characters.');
      return;
    }

    setChangePasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    triggerToast('Master password updated successfully.');
  };

  const handleWipeDatabase = () => {
    setWipeDbModalVisible(false);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    triggerToast('Local SQLite database encrypted keys purged.');
  };

  const getAutoLockLabel = () =>
    AUTO_LOCK_OPTIONS.find((o) => o.id === autoLockTimeout)?.label ?? 'After 1 minute';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* APP BAR */}
      <View style={styles.appBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={C.onSurface} />
        </Pressable>

        <Text style={styles.appBarTitle}>Security & Sessions</Text>

        <View style={styles.protectedBadge}>
          <MaterialIcons name="verified-user" size={14} color="#20C997" />
          <Text style={styles.protectedBadgeText}>SECURE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* TOAST NOTIFICATION */}
        {toastMessage ? (
          <View style={styles.toastCard}>
            <MaterialIcons name="check-circle" size={18} color="#89FE00" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        ) : null}

        {/* HERO ENCRYPTION STATUS CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIconWrap}>
              <MaterialIcons name="shield" size={22} color="#20C997" />
            </View>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroTitle}>Hardware AES-256 Active</Text>
              <Text style={styles.heroSubtitle}>Device-bound encryption engine</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            Your nutrition logs, intermittent fasts, medication history, and financial telemetry are stored locally in an encrypted SQLite database using hardware-backed SecureStore keys.
          </Text>

          <View style={styles.statusPillsRow}>
            <View style={styles.statusPill}>
              <MaterialIcons name="vpn-key" size={12} color="#20C997" />
              <Text style={styles.statusPillText}>KEYSTORE: LOCKED</Text>
            </View>
            <View style={styles.statusPill}>
              <MaterialIcons name="storage" size={12} color="#89CEFF" />
              <Text style={styles.statusPillText}>SQLITE: ENCRYPTED</Text>
            </View>
          </View>
        </View>

        {/* BIOMETRICS & APP LOCK */}
        <Text style={styles.sectionHeader}>BIOMETRICS & APP LOCK</Text>
        <View style={styles.cardGroup}>
          {/* BIOMETRIC UNLOCK */}
          <View style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(137, 206, 255, 0.15)' }]}>
              <MaterialIcons name="fingerprint" size={20} color="#89CEFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Biometric Unlock</Text>
              <Text style={styles.rowSubtitle}>Require Face ID or Fingerprint on app launch</Text>
            </View>
            <Switch
              value={biometricUnlock}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#004361' }}
              thumbColor={biometricUnlock ? '#89CEFF' : '#9E9E9E'}
            />
          </View>

          {/* AUTO-LOCK TIMEOUT */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              setAutoLockModalVisible(true);
            }}
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
              <MaterialIcons name="timer" size={20} color="#FCC419" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Auto-Lock Timeout</Text>
              <Text style={styles.rowSubtitle}>{getAutoLockLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* SCREEN PRIVACY GUARD */}
          <View style={styles.rowContainer}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <MaterialIcons name="visibility-off" size={20} color="#A78BFA" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Screen Privacy Guard</Text>
              <Text style={styles.rowSubtitle}>Blur app snapshot in device multitasking view</Text>
            </View>
            <Switch
              value={screenPrivacyGuard}
              onValueChange={handleTogglePrivacyGuard}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#004361' }}
              thumbColor={screenPrivacyGuard ? '#89CEFF' : '#9E9E9E'}
            />
          </View>
        </View>

        {/* ACCOUNT CREDENTIALS & 2FA */}
        <Text style={styles.sectionHeader}>ACCOUNT CREDENTIALS & 2FA</Text>
        <View style={styles.cardGroup}>
          {/* CHANGE PASSWORD */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              setChangePasswordModalVisible(true);
            }}
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialIcons name="password" size={20} color="#38BDF8" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Change Master Password</Text>
              <Text style={styles.rowSubtitle}>Update your authentication passcode</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* TWO FACTOR AUTH */}
          <View style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
              <MaterialIcons name="phonelink-lock" size={20} color="#20C997" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Two-Factor Authentication (2FA)</Text>
              <Text style={styles.rowSubtitle}>Authenticator app codes on login</Text>
            </View>
            <Switch
              value={twoFactorAuth}
              onValueChange={handleToggle2FA}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#004361' }}
              thumbColor={twoFactorAuth ? '#89CEFF' : '#9E9E9E'}
            />
          </View>

          {/* BACKUP KEY EXPORT */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              Alert.alert(
                'Recovery Key Export',
                'Your offline encrypted SQLite backup seed has been generated and securely copied to your clipboard.'
              );
            }}
            style={styles.rowContainer}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 135, 135, 0.15)' }]}>
              <MaterialIcons name="key" size={20} color="#FF8787" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Export Encrypted Recovery Key</Text>
              <Text style={styles.rowSubtitle}>Backup seed for offline database restoration</Text>
            </View>
            <MaterialIcons name="file-download" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>

        {/* ACTIVE MULTI-DEVICE SESSIONS */}
        <View style={styles.sessionsHeaderRow}>
          <Text style={styles.sectionHeader}>ACTIVE DEVICE SESSIONS ({sessions.length})</Text>
          {sessions.length > 1 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTerminateModalVisible(true)}
              style={styles.terminateHeaderBtn}>
              <Text style={styles.terminateHeaderBtnText}>Log Out Others</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.cardGroup}>
          {sessions.map((session, idx) => {
            const isLast = idx === sessions.length - 1;
            const iconName =
              session.type === 'phone'
                ? 'smartphone'
                : session.type === 'laptop'
                ? 'laptop-mac'
                : 'tablet-mac';

            return (
              <View
                key={session.id}
                style={[styles.sessionCard, !isLast && styles.rowBorder]}>
                <View
                  style={[
                    styles.sessionIconWrap,
                    session.isCurrent
                      ? { backgroundColor: 'rgba(32, 201, 151, 0.15)' }
                      : { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  ]}>
                  <MaterialIcons
                    name={iconName as any}
                    size={22}
                    color={session.isCurrent ? '#20C997' : C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    {session.isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.sessionClient}>{session.client}</Text>
                  <Text style={styles.sessionMeta}>
                    📍 {session.location} • {session.lastActive}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* DANGER ZONE: WIPE DATABASE */}
        <Text style={[styles.sectionHeader, { color: '#FF6B6B' }]}>DANGER ZONE</Text>
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeaderRow}>
            <View style={styles.dangerIconWrap}>
              <MaterialIcons name="delete-forever" size={22} color="#FF6B6B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Purge Local Database</Text>
              <Text style={styles.dangerSubtitle}>
                Permanently erase all local tracking records and reset hardware keys.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setWipeDbModalVisible(true)}
            style={styles.dangerBtn}>
            <MaterialIcons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.dangerBtnText}>Wipe Local SQLite Database</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AUTO-LOCK PICKER MODAL */}
      <Modal
        visible={autoLockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAutoLockModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAutoLockModalVisible(false)} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
                  <MaterialIcons name="timer" size={22} color="#FCC419" />
                </View>
                <Text style={styles.modalTitle}>Auto-Lock Timeout</Text>
              </View>

              <Pressable
                onPress={() => setAutoLockModalVisible(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {AUTO_LOCK_OPTIONS.map((opt) => {
                const isSelected = autoLockTimeout === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setAutoLockTimeout(opt.id);
                      setAutoLockModalVisible(false);
                      triggerToast(`Auto-lock set to ${opt.label}.`);
                    }}
                    style={[
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionRowSelected,
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.modalOptionTitle,
                          isSelected && { color: '#89CEFF', fontFamily: F.sansBold },
                        ]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.modalOptionDesc}>{opt.desc}</Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <MaterialIcons name="check" size={14} color="#002538" />
                      </View>
                    ) : (
                      <View style={styles.uncheckCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={changePasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setChangePasswordModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="password" size={22} color="#38BDF8" />
                </View>
                <Text style={styles.modalTitle}>Change Master Password</Text>
              </View>

              <Pressable
                onPress={() => setChangePasswordModalVisible(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPasswords}
              placeholder="Enter current passcode"
              placeholderTextColor={C.outline}
              style={styles.modalTextInput}
            />

            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              placeholder="Enter new password (min. 6 chars)"
              placeholderTextColor={C.outline}
              style={styles.modalTextInput}
            />

            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPasswords}
              placeholder="Re-enter new password"
              placeholderTextColor={C.outline}
              style={styles.modalTextInput}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPasswords((prev) => !prev)}
              style={styles.showPassToggle}>
              <MaterialIcons
                name={showPasswords ? 'visibility-off' : 'visibility'}
                size={16}
                color={C.onSurfaceVariant}
              />
              <Text style={styles.showPassText}>
                {showPasswords ? 'Hide characters' : 'Show characters'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleChangePasswordSubmit}
                style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Update Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setChangePasswordModalVisible(false)}
                style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TERMINATE SESSIONS MODAL */}
      <Modal
        visible={terminateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTerminateModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTerminateModalVisible(false)} />

          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.15)', alignSelf: 'center', marginBottom: 14 }]}>
              <MaterialIcons name="logout" size={26} color="#FF6B6B" />
            </View>

            <Text style={styles.terminateModalTitle}>Log Out Other Devices?</Text>
            <Text style={styles.terminateModalDesc}>
              This will immediately revoke active sessions on your MacBook, iPad, and all web companions. You will remain logged in on this device.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleTerminateOtherSessions}
                style={[styles.modalPrimaryBtn, { backgroundColor: '#FF6B6B' }]}>
                <Text style={[styles.modalPrimaryBtnText, { color: '#000000' }]}>
                  Log Out All Other Sessions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTerminateModalVisible(false)}
                style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WIPE DATABASE CONFIRMATION MODAL */}
      <Modal
        visible={wipeDbModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWipeDbModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setWipeDbModalVisible(false)} />

          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.15)', alignSelf: 'center', marginBottom: 14 }]}>
              <MaterialIcons name="delete-forever" size={28} color="#FF6B6B" />
            </View>

            <Text style={styles.terminateModalTitle}>Wipe Local Database?</Text>
            <Text style={styles.terminateModalDesc}>
              WARNING: This action is permanent and irreversible. All locally recorded fasts, macro logs, and biometric statistics will be destroyed.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleWipeDatabase}
                style={[styles.modalPrimaryBtn, { backgroundColor: '#FF6B6B' }]}>
                <Text style={[styles.modalPrimaryBtnText, { color: '#000000' }]}>
                  Permanently Erase Everything
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setWipeDbModalVisible(false)}
                style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>Keep My Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
  },
  protectedBadgeText: {
    color: '#20C997',
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },

  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  toastText: {
    flex: 1,
    color: '#E0E3E6',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },

  /* HERO CARD */
  heroCard: {
    borderRadius: Vital.radius.xxl,
    backgroundColor: C.surfaceContainer,
    padding: 18,
    marginBottom: 24,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconWrap: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleGroup: {
    flex: 1,
  },
  heroTitle: {
    color: C.onSurface,
    fontSize: 15.5,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  heroDesc: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    lineHeight: 17,
    marginTop: 12,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusPillText: {
    color: '#BDC8D2',
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },

  sectionHeader: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  cardGroup: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    overflow: 'hidden',
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBadge: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    color: C.onSurface,
    fontSize: 13.5,
    fontFamily: F.sansSemiBold,
  },
  rowSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },

  /* SESSIONS */
  sessionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  terminateHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  terminateHeaderBtnText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sessionIconWrap: {
    height: 42,
    width: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionName: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  currentBadge: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#20C997',
    fontSize: 9,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  sessionClient: {
    color: C.onSurfaceVariant,
    fontSize: 11.5,
    fontFamily: F.sans,
    marginTop: 2,
  },
  sessionMeta: {
    color: C.outline,
    fontSize: 10.5,
    fontFamily: F.sans,
    marginTop: 3,
  },

  /* DANGER ZONE */
  dangerCard: {
    borderRadius: Vital.radius.xl,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    padding: 16,
    gap: 12,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dangerIconWrap: {
    height: 38,
    width: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitle: {
    color: '#FF8787',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  dangerSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
    lineHeight: 15,
  },
  dangerBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: F.sansBold,
  },

  /* MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalIconCircle: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: F.sansBold,
    flex: 1,
  },
  modalCloseBtn: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  modalOptionRowSelected: {
    backgroundColor: 'rgba(137, 206, 255, 0.12)',
  },
  modalOptionTitle: {
    color: '#E0E3E6',
    fontSize: 13.5,
    fontFamily: F.sansMedium,
  },
  modalOptionDesc: {
    color: '#9E9E9E',
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  checkCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#89CEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  inputLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  modalTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: F.sans,
  },
  showPassToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  showPassText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
  },
  modalActions: {
    marginTop: 14,
    gap: 8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#89CEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#002538',
    fontSize: 13.5,
    fontFamily: F.sansBold,
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#E0E3E6',
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },

  terminateModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: F.sansBold,
    textAlign: 'center',
  },
  terminateModalDesc: {
    color: '#9E9E9E',
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    marginBottom: 18,
  },
});
