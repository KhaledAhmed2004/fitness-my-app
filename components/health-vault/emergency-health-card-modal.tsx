import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { LanguageSwitcherModal } from '@/components/health-vault/language-switcher-modal';
import { EmergencyHotlineModal } from '@/components/health-vault/emergency-hotline-modal';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface EmergencyHealthCardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EmergencyHealthCardModal({
  visible,
  onClose,
}: EmergencyHealthCardModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getEmergencyCardData = useHealthVaultStore((s) => s.getEmergencyCardData);
  const updateEmergencySettings = useHealthVaultStore((s) => s.updateEmergencySettings);
  const regenerateEmergencyQrToken = useHealthVaultStore((s) => s.regenerateEmergencyQrToken);
  const verifyEmergencyProfile = useHealthVaultStore((s) => s.verifyEmergencyProfile);

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosStatusMessage, setSosStatusMessage] = useState<string | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [hotlineModalVisible, setHotlineModalVisible] = useState(false);

  // Localization
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const supportedLanguages = useLanguageStore((s) => s.supportedLanguages);
  const t = useLanguageStore((s) => s.t);
  const translateClinical = useLanguageStore((s) => s.translateClinical);
  const getLocalizedSOSMessage = useLanguageStore((s) => s.getLocalizedSOSMessage);

  const currentLangInfo = useMemo(
    () => supportedLanguages.find((l) => l.code === currentLanguage) || supportedLanguages[0],
    [supportedLanguages, currentLanguage]
  );

  const cardData = useMemo(
    () => getEmergencyCardData(activeMemberId),
    [getEmergencyCardData, activeMemberId, members]
  );

  const { member, settings, criticalAllergies, criticalConditions, activeMedications, lastVerifiedAt } = cardData;

  const handleCallEmergencyContact = () => {
    if (!settings.emergencyContactPhone) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const cleanPhone = settings.emergencyContactPhone.replace(/[^0-9+]/g, '');
    void Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleBroadcastSos = async (type: 'SMS' | 'WHATSAPP' | 'COPY') => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setIsSendingSos(true);
    setSosStatusMessage(t('acquiring_gps', 'Acquiring live GPS location...'));

    let locationUrl = 'https://maps.google.com/?q=23.8103,90.4125';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        locationUrl = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      }
    } catch {
      locationUrl = 'https://maps.google.com/?q=23.8103,90.4125';
    }

    const cleanPhone = settings.emergencyContactPhone?.replace(/[^0-9+]/g, '') || '';
    const allergiesStr = criticalAllergies.length > 0 
      ? criticalAllergies.map(a => translateClinical(a.allergen)).join(', ') 
      : t('none_reported', 'None Reported');
    const conditionsStr = criticalConditions.length > 0 
      ? criticalConditions.map(c => translateClinical(c.conditionName)).join(', ') 
      : t('none_reported', 'None Reported');

    const sosMessage = getLocalizedSOSMessage({
      name: member?.name || 'Khaled Hossain',
      bloodGroup: member?.bloodGroup || 'B+',
      allergies: allergiesStr,
      conditions: conditionsStr,
      locationUrl,
      qrUrl: `https://trackme.health/emergency/${settings.qrToken || 'emg_token'}`,
    });

    setIsSendingSos(false);

    if (type === 'COPY') {
      await Clipboard.setStringAsync(sosMessage);
      setSosStatusMessage(t('sos_copied', '✅ SOS Message & GPS Location Copied!'));
      setTimeout(() => setSosStatusMessage(null), 4000);
      return;
    }

    if (type === 'SMS') {
      const smsUrl = cleanPhone
        ? `sms:${cleanPhone}?body=${encodeURIComponent(sosMessage)}`
        : `sms:?body=${encodeURIComponent(sosMessage)}`;
      void Linking.openURL(smsUrl).catch(() => {});
      setSosStatusMessage(t('sms_opened', '✅ SMS Dispatcher Opened'));
      setTimeout(() => setSosStatusMessage(null), 3000);
    } else if (type === 'WHATSAPP') {
      const waUrl = cleanPhone
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(sosMessage)}`
        : `whatsapp://send?text=${encodeURIComponent(sosMessage)}`;
      void Linking.openURL(waUrl).catch(() => {
        void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(sosMessage)}`).catch(() => {});
      });
      setSosStatusMessage(t('whatsapp_opened', '✅ WhatsApp Dispatcher Opened'));
      setTimeout(() => setSosStatusMessage(null), 3000);
    }
  };

  const handleVerifyToday = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await verifyEmergencyProfile(activeMemberId);
  };

  const handleRegenerateQr = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await regenerateEmergencyQrToken(activeMemberId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="emergency" size={22} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.title}>
                  {t('emergency_card_title', 'Emergency Medical ID')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('emergency_card_subtitle', 'Life-Safety HUD & Minimum Necessary Disclosure')}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Language Switcher Pill */}
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLanguageModalVisible(true);
                }}
                style={styles.langPillBtn}>
                <Text style={styles.langFlagText}>{currentLangInfo.flag}</Text>
                <Text style={styles.langCodeText}>{currentLangInfo.code.toUpperCase()}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setIsConfigOpen((prev) => !prev);
                }}
                style={[styles.configToggleBtn, isConfigOpen && styles.configToggleBtnActive]}>
                <MaterialIcons
                  name="tune"
                  size={18}
                  color={isConfigOpen ? '#101416' : '#F43F5E'}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBER SELECTOR TABS */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#F43F5E',
                        borderColor: '#F43F5E',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#FFFFFF', fontFamily: F.bold },
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {isConfigOpen ? (
              /* PRIVACY & EXPOSURE SETTINGS */
              <View style={styles.configCard}>
                <View style={styles.configHeaderRow}>
                  <MaterialIcons name="security" size={18} color="#38BDF8" />
                  <Text style={styles.configTitle}>DISCLOSURE CONFIGURATION</Text>
                </View>
                <Text style={styles.configSub}>
                  Control what essential information is exposed during an emergency.
                </Text>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Show Blood Group</Text>
                  <Switch
                    value={settings.showBloodGroup}
                    onValueChange={(val) =>
                      updateEmergencySettings(activeMemberId, { showBloodGroup: val })
                    }
                    trackColor={{ false: '#263035', true: '#F43F5E' }}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Show Critical Allergies</Text>
                  <Switch
                    value={settings.showCriticalAllergies}
                    onValueChange={(val) =>
                      updateEmergencySettings(activeMemberId, { showCriticalAllergies: val })
                    }
                    trackColor={{ false: '#263035', true: '#F43F5E' }}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Show Chronic Conditions</Text>
                  <Switch
                    value={settings.showCriticalConditions}
                    onValueChange={(val) =>
                      updateEmergencySettings(activeMemberId, { showCriticalConditions: val })
                    }
                    trackColor={{ false: '#263035', true: '#F43F5E' }}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Show Active Medications</Text>
                  <Switch
                    value={settings.showActiveMedications}
                    onValueChange={(val) =>
                      updateEmergencySettings(activeMemberId, { showActiveMedications: val })
                    }
                    trackColor={{ false: '#263035', true: '#F43F5E' }}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleRegenerateQr}
                  style={styles.revokeQrBtn}>
                  <MaterialIcons name="refresh" size={16} color="#FF922B" />
                  <Text style={styles.revokeQrText}>Revoke & Regenerate QR Token</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* EMERGENCY HUD CARD */}
            <View style={styles.hudCard}>
              {/* Card Top Banner */}
              <View style={styles.hudTop}>
                <View style={styles.hudTopLeft}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.hudHeaderTag}>
                    {t('medical_card_title', 'CRITICAL EMERGENCY MEDICAL ID')}
                  </Text>
                </View>

                <View style={styles.verifiedPill}>
                  <MaterialIcons name="verified" size={12} color="#20C997" />
                  <Text style={styles.verifiedText}>Verified {lastVerifiedAt}</Text>
                </View>
              </View>

              {/* Patient Hero Info */}
              <View style={styles.hudHeroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{member.name}</Text>
                  <Text style={styles.patientMeta}>
                    {translateClinical(member.gender)} • {member.dateOfBirth || 'N/A'} • {translateClinical(member.relation)}
                  </Text>
                </View>

                {settings.showBloodGroup && member.bloodGroup !== 'UNKNOWN' && (
                  <View style={styles.bloodBadgeLarge}>
                    <Text style={styles.bloodGroupLabel}>{t('blood_group', 'BLOOD')}</Text>
                    <Text style={styles.bloodGroupValue}>{member.bloodGroup}</Text>
                  </View>
                )}
              </View>

              {/* CRITICAL ALLERGIES ALERT */}
              {settings.showCriticalAllergies && (
                <View style={styles.hudSection}>
                  <View style={styles.sectionHeadingRow}>
                    <MaterialIcons name="warning" size={14} color="#FF6B6B" />
                    <Text style={[styles.sectionHeadingText, { color: '#FF6B6B' }]}>
                      {t('critical_allergies', 'CRITICAL ALLERGIES')} ({criticalAllergies.length})
                    </Text>
                  </View>

                  {criticalAllergies.length === 0 ? (
                    <Text style={styles.noDataText}>{t('no_allergies', 'No known critical allergies')}</Text>
                  ) : (
                    criticalAllergies.map((alg) => (
                      <View key={alg.id} style={styles.allergyItemBox}>
                        <Text style={styles.allergenTitle}>{translateClinical(alg.allergen)}</Text>
                        <Text style={styles.allergyReaction}>
                          Reaction: {translateClinical(alg.reaction || 'Severe Reaction')} ({alg.severity})
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* CRITICAL CHRONIC CONDITIONS */}
              {settings.showCriticalConditions && (
                <View style={styles.hudSection}>
                  <View style={styles.sectionHeadingRow}>
                    <MaterialIcons name="healing" size={14} color="#A78BFA" />
                    <Text style={[styles.sectionHeadingText, { color: '#A78BFA' }]}>
                      {t('chronic_conditions', 'CHRONIC CONDITIONS & IMPAIRMENTS')}
                    </Text>
                  </View>

                  {criticalConditions.length === 0 ? (
                    <Text style={styles.noDataText}>{t('no_conditions', 'No critical chronic conditions')}</Text>
                  ) : (
                    criticalConditions.map((cond) => (
                      <View key={cond.id} style={styles.conditionItemBox}>
                        <Text style={styles.conditionTitle}>{translateClinical(cond.conditionName)}</Text>
                        {cond.notes ? (
                          <Text style={styles.conditionNotes}>{cond.notes}</Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* ACTIVE MEDICATIONS */}
              {settings.showActiveMedications && (
                <View style={styles.hudSection}>
                  <View style={styles.sectionHeadingRow}>
                    <MaterialIcons name="medication" size={14} color="#FF922B" />
                    <Text style={[styles.sectionHeadingText, { color: '#FF922B' }]}>
                      {t('active_medications', 'CURRENT ACTIVE MEDICATIONS')}
                    </Text>
                  </View>

                  {activeMedications.length === 0 ? (
                    <Text style={styles.noDataText}>{t('no_meds', 'No active medications in cabinet')}</Text>
                  ) : (
                    <View style={styles.medsChipsRow}>
                      {activeMedications.map((med, idx) => (
                        <View key={idx} style={styles.medChip}>
                          <Text style={styles.medChipText}>{med}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* EMERGENCY CONTACT & CALL ACTION */}
              <View style={styles.contactSection}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{t('emergency_contact', 'EMERGENCY CONTACT')}</Text>
                  <Text style={styles.contactName}>
                    {settings.emergencyContactName} ({translateClinical(settings.emergencyContactRelation)})
                  </Text>
                  <Text style={styles.contactPhone}>
                    {settings.emergencyContactPhone || 'No phone set'}
                  </Text>
                </View>

                {settings.emergencyContactPhone ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleCallEmergencyContact}
                    style={styles.callContactBtn}>
                    <MaterialIcons name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.callContactBtnText}>{t('call_btn', 'CALL')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 🆘 1-TAP EMERGENCY SOS BROADCAST SECTION */}
              <View style={styles.sosBroadcastCard}>
                <View style={styles.sosHeader}>
                  <View style={styles.sosIconBox}>
                    <MaterialIcons name="crisis-alert" size={20} color="#F43F5E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sosTitle}>
                      {t('sos_dispatcher_title', '1-Tap SOS Dispatcher')}
                    </Text>
                    <Text style={styles.sosSub}>
                      {t('sos_dispatcher_sub', 'Broadcasts live GPS location & medical profile')}
                    </Text>
                  </View>
                </View>

                {sosStatusMessage ? (
                  <View style={styles.sosStatusPill}>
                    <Text style={styles.sosStatusPillText}>{sosStatusMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.sosActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSendingSos}
                    onPress={() => handleBroadcastSos('SMS')}
                    style={[styles.sosBtn, { backgroundColor: '#F43F5E' }]}>
                    {isSendingSos ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="sms" size={16} color="#FFFFFF" />
                        <Text style={styles.sosBtnText}>{t('sos_send_sms', 'SMS SOS')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSendingSos}
                    onPress={() => handleBroadcastSos('WHATSAPP')}
                    style={[styles.sosBtn, { backgroundColor: '#25D366' }]}>
                    <MaterialIcons name="chat" size={16} color="#FFFFFF" />
                    <Text style={styles.sosBtnText}>{t('sos_send_whatsapp', 'WhatsApp')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSendingSos}
                    onPress={() => handleBroadcastSos('COPY')}
                    style={[styles.sosBtn, { backgroundColor: '#1E293B' }]}>
                    <MaterialIcons name="content-copy" size={16} color="#38BDF8" />
                    <Text style={[styles.sosBtnText, { color: '#38BDF8' }]}>{t('sos_copy', 'Copy')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SECURE WEB QR TOKEN PREVIEW */}
              <View style={styles.qrSection}>
                <View style={styles.qrIconBox}>
                  <MaterialIcons name="qr-code-2" size={24} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qrTitle}>Secure Emergency Web Token</Text>
                  <Text style={styles.qrSub}>
                    Token: {settings.qrToken || 'emg_temp_token'}
                  </Text>
                  <Text style={styles.qrNote}>
                    Read-only, revocable URL for first responders.
                  </Text>
                </View>
              </View>
            </View>

            {/* EMERGENCY HOTLINE & AMBULANCE DIRECTORY BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setHotlineModalVisible(true)}
              style={styles.hotlineDirectoryBtn}>
              <View style={styles.hotlineDirectoryLeft}>
                <View style={styles.hotlineIconCircle}>
                  <MaterialIcons name="local-hospital" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotlineDirectoryTitle}>
                    🚨 জরুরি অ্যাম্বুলেন্স, আইসিইউ ও ২৪/৭ ফার্মেসি
                  </Text>
                  <Text style={styles.hotlineDirectorySub}>
                    ৯৯৯, বিভাগীয় অ্যাম্বুলেন্স, অক্সিজেন ও ব্লাড ব্যাংক হেল্পলাইন
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            {/* VERIFY TODAY ACTION */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyToday}
              style={styles.verifyBtn}>
              <MaterialIcons name="check-circle-outline" size={18} color="#20C997" />
              <Text style={styles.verifyBtnText}>
                Confirm & Mark Profile Verified for Today
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <LanguageSwitcherModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <EmergencyHotlineModal
        visible={hotlineModalVisible}
        onClose={() => setHotlineModalVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 63, 94, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langFlagText: {
    fontSize: 13,
  },
  langCodeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  configToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configToggleBtnActive: {
    backgroundColor: '#F43F5E',
  },
  closeBtn: {
    padding: 6,
  },
  membersBar: {
    backgroundColor: '#141A1D',
    paddingVertical: 8,
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#1A2226',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  configCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  configHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  configSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  revokeQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  revokeQrText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FF922B',
  },
  hudCard: {
    backgroundColor: '#141A1D',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#F43F5E',
  },
  hudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  },
  hudHeaderTag: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#F43F5E',
    letterSpacing: 0.8,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  hudHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  patientMeta: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  bloodBadgeLarge: {
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGroupLabel: {
    fontFamily: F.bold,
    fontSize: 7,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bloodGroupValue: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  hudSection: {
    gap: 6,
    backgroundColor: '#181F23',
    padding: 10,
    borderRadius: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeadingText: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  noDataText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
  },
  allergyItemBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  allergenTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  allergyReaction: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#FF6B6B',
    marginTop: 2,
  },
  conditionItemBox: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#A78BFA',
  },
  conditionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  conditionNotes: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  medsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medChip: {
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  medChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#FF922B',
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E262B',
    borderRadius: 14,
    padding: 12,
  },
  contactInfo: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  contactLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  contactName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  contactPhone: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  callContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F43F5E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callContactBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  sosBroadcastCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  sosSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  sosStatusPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sosStatusPillText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
    textAlign: 'center',
  },
  sosActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sosBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sosBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    padding: 12,
    borderRadius: 12,
  },
  qrIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  qrSub: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 1,
  },
  qrNote: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  verifyBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  hotlineDirectoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 8,
  },
  hotlineDirectoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 12,
  },
  hotlineIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineDirectoryTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  hotlineDirectorySub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
  },
});
