/**
 * Client CRM & Athlete Management Modal — Pillar 1
 * Complete Client Roster, PAR-Q+ Medical Clearance, Orthopedic Injury Shield,
 * and 12/24-Session Package Milestone Tracker with 1-Tap Attendance Punch.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { CoachTheme } from '@/constants/coach-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { EnrollAthleteModal } from './enroll-athlete-modal';
import { CoachDietPrescriptionModal } from './coach-diet-prescription-modal';
import { WhatsAppShareCardModal, WhatsAppShareMode } from './whatsapp-share-card';
import { TransformationProofBuilderModal } from './transformation-proof-builder';
import type {
  AthleteClientDossier,
  ClientGoalType,
  ClientInjuryRecord,
  PaymentMethod,
} from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;
const TC = CoachTheme.colors;

interface ClientCrmModalProps {
  visible: boolean;
  onClose: () => void;
}

type FilterGoal = 'ALL' | ClientGoalType;

const GOAL_FILTERS: { key: FilterGoal; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { key: 'ALL', label: 'All Clients', icon: 'groups', color: TC.forestDark },
  { key: 'HYPERTROPHY', label: 'Hypertrophy', icon: 'fitness-center', color: TC.forestDark },
  { key: 'FAT_LOSS', label: 'Fat Loss', icon: 'local-fire-department', color: TC.fatLossText },
  { key: 'POWERLIFTING', label: 'Powerlifting', icon: 'flash-on', color: '#B45309' },
  { key: 'REHAB', label: 'Rehab & Spine', icon: 'healing', color: TC.rehabText },
  { key: 'ATHLETIC_CONDITIONING', label: 'Conditioning', icon: 'directions-run', color: TC.conditioningText },
];

export function ClientCrmModal({ visible, onClose }: ClientCrmModalProps) {
  const { clients, punchClientSession, renewClientPackage, updateClient } = useTrainerStore();

  const [selectedGoal, setSelectedGoal] = useState<FilterGoal>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDossierClient, setActiveDossierClient] = useState<AthleteClientDossier | null>(null);
  const [addClientModalVisible, setAddClientModalVisible] = useState(false);
  const [dietModalVisible, setDietModalVisible] = useState(false);
  const [dietTargetClientId, setDietTargetClientId] = useState<string | undefined>(undefined);

  // WhatsApp & Transformation Proof Modals
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [whatsappTargetClient, setWhatsappTargetClient] = useState<AthleteClientDossier | null>(null);
  const [whatsappMode, setWhatsappMode] = useState<WhatsAppShareMode>('SESSION_BALANCE');

  const [transformationModalVisible, setTransformationModalVisible] = useState(false);
  const [transformationTargetClient, setTransformationTargetClient] = useState<AthleteClientDossier | null>(null);

  // Renewal Modal
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [renewalTargetClient, setRenewalTargetClient] = useState<AthleteClientDossier | null>(null);
  const [renewalPackageType, setRenewalPackageType] = useState<'MONTHLY_12' | 'TRANSFORMATION_24'>('MONTHLY_12');
  const [renewalMethod, setRenewalMethod] = useState<PaymentMethod>('bKash');
  const [renewalTrxId, setRenewalTrxId] = useState('');
  const [renewalPrice, setRenewalPrice] = useState('15000');

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesGoal = selectedGoal === 'ALL' || c.goal === selectedGoal;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.currentPhase.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGoal && matchesSearch;
    });
  }, [clients, selectedGoal, searchQuery]);

  // Total Metrics
  const activeCount = clients.filter((c) => c.status === 'ACTIVE').length;
  const rehabCount = clients.filter((c) => c.injuries.length > 0).length;
  const expiringSoonCount = clients.filter((c) => c.package.remainingSessions <= 3).length;

  const handlePunchSession = async (client: AthleteClientDossier) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const result = await punchClientSession(client.id, `${client.currentPhase} • 1-on-1 Punch`);
    const updated = useTrainerStore.getState().clients.find((c) => c.id === client.id);
    if (activeDossierClient?.id === client.id && updated) {
      setActiveDossierClient(updated);
    }

    if (result?.shouldAlertRenewal && updated) {
      Alert.alert(
        '⚠️ Package Renewal Due!',
        `${client.name} has only ${result.remaining} session(s) remaining in their package. Send WhatsApp renewal reminder or renew now?`,
        [
          {
            text: 'Send WhatsApp Card',
            onPress: () => {
              setWhatsappTargetClient(updated);
              setWhatsappMode('SESSION_BALANCE');
              setWhatsappModalVisible(true);
            },
          },
          {
            text: 'Renew Package',
            onPress: () => {
              handleOpenRenewalModal(updated);
            },
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    }
  };

  const handleOpenRenewalModal = (client: AthleteClientDossier, type: 'MONTHLY_12' | 'TRANSFORMATION_24' = 'MONTHLY_12') => {
    setRenewalTargetClient(client);
    setRenewalPackageType(type);
    setRenewalPrice(type === 'TRANSFORMATION_24' ? '26000' : '15000');
    setRenewalMethod('bKash');
    setRenewalTrxId('');
    setRenewalModalVisible(true);
  };

  const handleConfirmRenewal = async () => {
    if (!renewalTargetClient) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const priceNum = parseFloat(renewalPrice) || (renewalPackageType === 'TRANSFORMATION_24' ? 26000 : 15000);
    await renewClientPackage(renewalTargetClient.id, renewalPackageType, {
      paymentMethod: renewalMethod,
      transactionId: renewalTrxId.trim() || undefined,
      amountBdt: priceNum,
      note: `Renewal (${renewalPackageType === 'TRANSFORMATION_24' ? 24 : 12} Sessions) via ${renewalMethod}`,
    });

    const updated = useTrainerStore.getState().clients.find((c) => c.id === renewalTargetClient.id);
    setRenewalModalVisible(false);

    if (updated) {
      if (activeDossierClient?.id === updated.id) setActiveDossierClient(updated);
      Alert.alert(
        'Package Renewed & Paid! 🎉',
        `Recorded ৳${priceNum.toLocaleString()} via ${renewalMethod}. Send official WhatsApp money receipt?`,
        [
          {
            text: 'Send Receipt',
            onPress: () => {
              setWhatsappTargetClient(updated);
              setWhatsappMode('PAYMENT_RECEIPT');
              setWhatsappModalVisible(true);
            },
          },
          { text: 'Done', style: 'default' },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: TC.screenBg }]} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={TC.forestDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ATHLETE CLIENTS CRM</Text>
            <Text style={styles.headerSubtitle}>PAR-Q+ Safety, Injuries & 12-Session Track</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setDietTargetClientId(undefined);
                setDietModalVisible(true);
              }}
              style={styles.dietVaultHeaderBtn}>
              <MaterialIcons name="restaurant-menu" size={15} color={TC.forestDark} />
              <Text style={styles.dietVaultHeaderBtnText}>Diets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAddClientModalVisible(true);
              }}
              style={styles.addClientHeaderBtn}>
              <MaterialIcons name="person-add" size={15} color={TC.btnPrimaryTextLime} />
              <Text style={styles.addClientHeaderBtnText}>+ Client</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* STATS BENTO */}
          <View style={styles.statsBento}>
            <View style={styles.bentoItem}>
              <Text style={[styles.bentoVal, { color: TC.forestDark }]}>{activeCount}</Text>
              <Text style={styles.bentoLbl}>Active Athletes</Text>
            </View>
            <View style={styles.bentoItem}>
              <Text style={[styles.bentoVal, { color: TC.rehabText }]}>{rehabCount}</Text>
              <Text style={styles.bentoLbl}>Injury Shields</Text>
            </View>
            <View style={styles.bentoItem}>
              <Text style={[styles.bentoVal, { color: TC.warningRenewalText }]}>{expiringSoonCount}</Text>
              <Text style={styles.bentoLbl}>Renewals Due</Text>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchBarContainer}>
            <MaterialIcons name="search" size={20} color={TC.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by client name, phone, phase..."
              placeholderTextColor={TC.inputPlaceholder}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={18} color={TC.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* GOAL FILTER CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalChipsScroll}>
            {GOAL_FILTERS.map((filter) => {
              const isSelected = selectedGoal === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedGoal(filter.key);
                  }}
                  style={[
                    styles.goalChip,
                    isSelected && styles.goalChipActive,
                  ]}>
                  <MaterialIcons
                    name={filter.icon}
                    size={14}
                    color={isSelected ? TC.chipActiveText : TC.chipInactiveText}
                  />
                  <Text
                    style={[
                      styles.goalChipText,
                      isSelected && styles.goalChipTextActive,
                    ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* CLIENTS LIST */}
          <View style={styles.clientsSection}>
            <Text style={styles.sectionHeader}>ROSTER DIRECTORY ({filteredClients.length})</Text>

            {filteredClients.map((client) => {
              const packagePercent = Math.round(
                (client.package.completedSessions / client.package.totalSessions) * 100
              );
              const hasInjuries = client.injuries.length > 0;

              return (
                <TouchableOpacity
                  key={client.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveDossierClient(client);
                  }}
                  style={styles.clientCard}>
                  {/* TOP ROW */}
                  <View style={styles.clientTopRow}>
                    <View style={styles.clientAvatarWrap}>
                      <Text style={styles.clientInitials}>
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.clientCardName}>{client.name}</Text>
                        <Text style={styles.clientAgeGender}>
                          {client.age}y • {client.gender === 'MALE' ? 'M' : 'F'}
                        </Text>
                      </View>
                      <Text style={styles.clientCurrentPhase} numberOfLines={1}>
                        {client.currentPhase}
                      </Text>
                    </View>

                    {/* GOAL BADGE */}
                    <View
                      style={[
                        styles.goalBadge,
                        client.goal === 'REHAB'
                          ? { backgroundColor: TC.rehabBg, borderColor: TC.rehabBorder }
                          : client.goal === 'FAT_LOSS'
                          ? { backgroundColor: TC.fatLossBg, borderColor: TC.fatLossBorder }
                          : { backgroundColor: TC.hypertrophyBg, borderColor: TC.hypertrophyBorder },
                      ]}>
                      <Text
                        style={[
                          styles.goalBadgeText,
                          client.goal === 'REHAB'
                            ? { color: TC.rehabText }
                            : client.goal === 'FAT_LOSS'
                            ? { color: TC.fatLossText }
                            : { color: TC.hypertrophyText },
                        ]}>
                        {client.goal.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  {/* ACTIVE DIET PLAN BADGE */}
                  {client.dietPlan ? (
                    <View style={styles.dietActivePill}>
                      <MaterialIcons name="restaurant-menu" size={13} color={TC.forestDark} />
                      <Text style={styles.dietActivePillText} numberOfLines={1}>
                        🥗 <Text style={{ fontFamily: F.sansBold, color: TC.forestDark }}>{client.dietPlan.calories} kcal</Text> • {client.dietPlan.proteinG}g P ({client.dietPlan.dietTitle.split('(')[0].trim()})
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setDietTargetClientId(client.id);
                        setDietModalVisible(true);
                      }}
                      style={styles.dietUnassignedPill}>
                      <MaterialIcons name="add-circle-outline" size={13} color={TC.forestDark} />
                      <Text style={styles.dietUnassignedPillText}>+ Prescribe High-Protein Desi Diet</Text>
                    </TouchableOpacity>
                  )}

                  {/* PAR-Q & INJURY SHIELD ALERT PILL */}
                  {hasInjuries ? (
                    <View style={styles.injuryAlertPill}>
                      <MaterialIcons name="warning" size={14} color={TC.warningRenewalText} />
                      <Text style={styles.injuryAlertPillText} numberOfLines={1}>
                        {client.injuries[0].jointOrArea} — Contraindicated Lifts Active
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.cleanClearancePill}>
                      <MaterialIcons name="verified-user" size={13} color={TC.forestDark} />
                      <Text style={styles.cleanClearancePillText}>PAR-Q+ Medical Clearance Approved</Text>
                    </View>
                  )}

                  {/* PACKAGE SESSIONS BAR */}
                  <View style={styles.packageTrackWrap}>
                    <View style={styles.packageTrackHeader}>
                      <Text style={styles.packageTrackLabel}>
                        PT: <Text style={{ color: TC.forestDark, fontFamily: F.sansBold }}>{client.package.packageType.replace('_', ' ')}</Text>
                      </Text>
                      <Text style={styles.packageSessionsCount}>
                        <Text style={{ color: client.package.remainingSessions <= 1 ? TC.urgentRenewalText : TC.forestDark, fontFamily: F.monoBold }}>
                          {client.package.completedSessions}
                        </Text>
                        /{client.package.totalSessions} ({client.package.remainingSessions} left)
                      </Text>
                    </View>

                    {client.package.remainingSessions <= 1 ? (
                      <View style={styles.renewalUrgentBadge}>
                        <MaterialIcons name="notification-important" size={12} color={TC.urgentRenewalText} />
                        <Text style={styles.renewalUrgentText}>
                          RENEWAL DUE: {client.package.remainingSessions} Session Left!
                        </Text>
                      </View>
                    ) : client.package.remainingSessions <= 3 ? (
                      <View style={styles.renewalWarningBadge}>
                        <MaterialIcons name="schedule" size={12} color={TC.warningRenewalText} />
                        <Text style={styles.renewalWarningText}>
                          Expiring Soon ({client.package.remainingSessions} Sessions Left)
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${packagePercent}%`,
                            backgroundColor: client.package.remainingSessions <= 1 ? TC.urgentRenewalText : TC.progressFill,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* BOTTOM ACTION BUTTONS */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setWhatsappTargetClient(client);
                        setWhatsappMode('SESSION_BALANCE');
                        setWhatsappModalVisible(true);
                      }}
                      style={styles.cardWhatsAppBtn}>
                      <MaterialIcons name="share" size={13} color={TC.forestDark} />
                      <Text style={styles.cardWhatsAppBtnText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setTransformationTargetClient(client);
                        setTransformationModalVisible(true);
                      }}
                      style={styles.cardProofBtn}>
                      <MaterialIcons name="auto-graph" size={13} color={TC.forestDark} />
                      <Text style={styles.cardProofBtnText}>Proof</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setDietTargetClientId(client.id);
                        setDietModalVisible(true);
                      }}
                      style={styles.cardDietBtn}>
                      <MaterialIcons name="restaurant" size={13} color={TC.forestDark} />
                      <Text style={styles.cardDietBtnText}>Diet</Text>
                    </TouchableOpacity>

                    {client.package.remainingSessions <= 1 ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenRenewalModal(client)}
                        style={styles.cardRenewQuickBtn}>
                        <MaterialIcons name="payments" size={13} color="#FFF" />
                        <Text style={styles.cardRenewQuickBtnText}>Renew</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handlePunchSession(client)}
                        style={styles.punchSessionBtn}>
                        <MaterialIcons name="touch-app" size={13} color={TC.btnPrimaryTextLime} />
                        <Text style={styles.punchSessionBtnText}>+ Punch</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* 📋 DETAILED ATHLETE DOSSIER MODAL */}
        {activeDossierClient && (
          <Modal
            visible={!!activeDossierClient}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setActiveDossierClient(null)}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveDossierClient(null)}
                  style={styles.backBtn}>
                  <MaterialIcons name="close" size={22} color={C.onSurface} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>{activeDossierClient.name.toUpperCase()}</Text>
                  <Text style={styles.headerSubtitle}>Athlete Clinical Dossier & PAR-Q+ Vault</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (activeDossierClient.phone) {
                      void Linking.openURL(`tel:${activeDossierClient.phone}`);
                    }
                  }}
                  style={styles.callIconBtn}>
                  <MaterialIcons name="phone" size={18} color="#89FE00" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. BIOMETRIC PROGRESSION BENCHMARK */}
                <View style={styles.dossierSectionCard}>
                  <Text style={styles.dossierCardHeader}>🎯 BIOMETRICS & TARGET STATS</Text>
                  <View style={styles.weightProgressRow}>
                    <View style={styles.weightItem}>
                      <Text style={styles.weightVal}>{activeDossierClient.startingWeightKg} kg</Text>
                      <Text style={styles.weightLbl}>Starting</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color="#89FE00" />
                    <View style={styles.weightItem}>
                      <Text style={[styles.weightVal, { color: '#89FE00' }]}>
                        {activeDossierClient.currentWeightKg} kg
                      </Text>
                      <Text style={styles.weightLbl}>Current</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color="#00B4D8" />
                    <View style={styles.weightItem}>
                      <Text style={[styles.weightVal, { color: '#00B4D8' }]}>
                        {activeDossierClient.targetWeightKg} kg
                      </Text>
                      <Text style={styles.weightLbl}>Goal Target</Text>
                    </View>
                  </View>
                  <View style={styles.phaseInfoBox}>
                    <Text style={styles.phaseInfoText}>
                      <Text style={{ fontFamily: F.sansBold, color: '#89FE00' }}>Current Block: </Text>
                      {activeDossierClient.currentPhase}
                    </Text>
                  </View>
                </View>

                {/* 2. 🦴 PAR-Q+ & ORTHOPEDIC INJURY SHIELD VAULT */}
                <View style={[styles.dossierSectionCard, { borderColor: 'rgba(255, 184, 0, 0.35)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MaterialIcons name="shield" size={18} color="#FFB800" />
                    <Text style={[styles.dossierCardHeader, { color: '#FFB800', marginBottom: 0 }]}>
                      PAR-Q+ & ORTHOPEDIC INJURY SHIELD
                    </Text>
                  </View>

                  <View style={styles.parQStatusRow}>
                    <View style={styles.parQStatusBadge}>
                      <MaterialIcons name="verified" size={14} color="#89FE00" />
                      <Text style={styles.parQStatusBadgeText}>Medical Clearance Approved</Text>
                    </View>
                    {activeDossierClient.parQ.physicianName && (
                      <Text style={styles.physicianNameText}>
                        🩺 {activeDossierClient.parQ.physicianName}
                      </Text>
                    )}
                  </View>

                  {/* INJURIES LIST */}
                  {activeDossierClient.injuries.length > 0 ? (
                    activeDossierClient.injuries.map((inj) => (
                      <View key={inj.id} style={styles.injuryDetailsBox}>
                        <View style={styles.injuryJointTitleRow}>
                          <MaterialIcons name="warning" size={16} color="#FF5C5C" />
                          <Text style={styles.injuryJointName}>{inj.jointOrArea}</Text>
                          <View style={styles.severityBadge}>
                            <Text style={styles.severityBadgeText}>{inj.severity}</Text>
                          </View>
                        </View>

                        {/* CONTRAINDICATED MOVEMENTS (RED LIST) */}
                        <View style={styles.contraindicatedCard}>
                          <Text style={styles.contraindicatedTitle}>
                            🚫 CONTRAINDICATED (NEVER ASSIGN):
                          </Text>
                          {inj.contraindicatedMovements.map((mov, i) => (
                            <Text key={i} style={styles.contraindicatedItem}>
                              • {mov}
                            </Text>
                          ))}
                        </View>

                        {/* SAFE ALTERNATIVES (GREEN LIST) */}
                        <View style={styles.safeAltCard}>
                          <Text style={styles.safeAltTitle}>
                            ✅ SAFE REPLACEMENTS (PRESCRIBE):
                          </Text>
                          {inj.safeAlternatives.map((alt, i) => (
                            <Text key={i} style={styles.safeAltItem}>
                              ✓ {alt}
                            </Text>
                          ))}
                        </View>

                        <Text style={styles.injuryClinicalNotes}>
                          💡 <Text style={{ fontFamily: F.sansBold }}>Coach Guidance: </Text>
                          {inj.notes}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noInjuriesCard}>
                      <MaterialIcons name="check-circle" size={18} color="#89FE00" />
                      <Text style={styles.noInjuriesText}>
                        No orthopedic contraindications or joint limitations reported.
                      </Text>
                    </View>
                  )}

                  {/* EMERGENCY CONTACT */}
                  <View style={styles.emergencyContactRow}>
                    <MaterialIcons name="contact-phone" size={14} color={C.onSurfaceVariant} />
                    <Text style={styles.emergencyContactText}>
                      Emergency: {activeDossierClient.parQ.emergencyContact.name} ({activeDossierClient.parQ.emergencyContact.relation}) •{' '}
                      <Text style={{ color: '#89FE00' }}>{activeDossierClient.parQ.emergencyContact.phone}</Text>
                    </Text>
                  </View>
                </View>

                {/* 3. 🎟️ PT SESSION PACKAGE & ATTENDANCE LEDGER */}
                <View style={styles.dossierSectionCard}>
                  <Text style={styles.dossierCardHeader}>🎟️ PT PACKAGE & SESSION MILESTONE TRACK</Text>

                  <View style={styles.packageSummaryRow}>
                    <View style={styles.pkgStatBox}>
                      <Text style={[styles.pkgStatVal, { color: '#89FE00' }]}>
                        {activeDossierClient.package.completedSessions}
                      </Text>
                      <Text style={styles.pkgStatLbl}>Completed</Text>
                    </View>
                    <View style={styles.pkgStatBox}>
                      <Text style={[styles.pkgStatVal, { color: '#00B4D8' }]}>
                        {activeDossierClient.package.remainingSessions}
                      </Text>
                      <Text style={styles.pkgStatLbl}>Remaining</Text>
                    </View>
                    <View style={styles.pkgStatBox}>
                      <Text style={styles.pkgStatVal}>{activeDossierClient.package.totalSessions}</Text>
                      <Text style={styles.pkgStatLbl}>Total Pack</Text>
                    </View>
                    <View style={styles.pkgStatBox}>
                      <Text style={[styles.pkgStatVal, { color: '#FFB800' }]}>৳{activeDossierClient.package.priceBdt / 1000}k</Text>
                      <Text style={styles.pkgStatLbl}>Paid Fee</Text>
                    </View>
                  </View>

                  <View style={styles.packageActionButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePunchSession(activeDossierClient)}
                      style={styles.dossierPunchBtn}>
                      <MaterialIcons name="touch-app" size={16} color="#002233" />
                      <Text style={styles.dossierPunchBtnText}>Punch Session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenRenewalModal(activeDossierClient, 'MONTHLY_12')}
                      style={styles.dossierRenewBtn}>
                      <MaterialIcons name="autorenew" size={16} color="#00B4D8" />
                      <Text style={styles.dossierRenewBtnText}>Renew Pack</Text>
                    </TouchableOpacity>
                  </View>

                  {/* WHATSAPP & PROOF FAST ACTIONS ROW */}
                  <View style={styles.dossierFastShareRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setWhatsappTargetClient(activeDossierClient);
                        setWhatsappMode('SESSION_BALANCE');
                        setWhatsappModalVisible(true);
                      }}
                      style={styles.dossierWhatsAppBtn}>
                      <MaterialIcons name="share" size={15} color="#25D366" />
                      <Text style={styles.dossierWhatsAppBtnText}>Send WhatsApp Ledger</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setTransformationTargetClient(activeDossierClient);
                        setTransformationModalVisible(true);
                      }}
                      style={styles.dossierProofBtn}>
                      <MaterialIcons name="auto-graph" size={15} color="#A78BFA" />
                      <Text style={styles.dossierProofBtnText}>Transformation Proof</Text>
                    </TouchableOpacity>
                  </View>

                  {/* PAYMENT HISTORY */}
                  <Text style={[styles.attendanceHistoryTitle, { marginTop: 14 }]}>
                    💰 PAYMENT & RENEWAL LEDGER ({activeDossierClient.package.paymentLog?.length || 0})
                  </Text>
                  <View style={styles.attendanceList}>
                    {activeDossierClient.package.paymentLog && activeDossierClient.package.paymentLog.length > 0 ? (
                      activeDossierClient.package.paymentLog.map((pay, pIdx) => (
                        <View key={pay.id || pIdx} style={styles.paymentRecordRow}>
                          <View style={styles.paymentMethodPill}>
                            <Text style={styles.paymentMethodPillText}>{pay.method}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.paymentAmountText}>৳{pay.amountBdt.toLocaleString()} BDT</Text>
                            <Text style={styles.paymentMetaText}>
                              {pay.date} {pay.transactionId ? `• Trx: ${pay.transactionId}` : ''}
                            </Text>
                            {pay.note && <Text style={styles.paymentNoteText}>{pay.note}</Text>}
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              setWhatsappTargetClient(activeDossierClient);
                              setWhatsappMode('PAYMENT_RECEIPT');
                              setWhatsappModalVisible(true);
                            }}
                            style={styles.shareReceiptIconBtn}>
                            <MaterialIcons name="receipt" size={16} color="#89FE00" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <View style={styles.noPaymentNotice}>
                        <Text style={styles.noPaymentNoticeText}>No previous payments recorded for this package.</Text>
                      </View>
                    )}
                  </View>

                  {/* ATTENDANCE HISTORY */}
                  <Text style={[styles.attendanceHistoryTitle, { marginTop: 14 }]}>
                    ATTENDANCE LEDGER ({activeDossierClient.package.attendanceHistory.length})
                  </Text>
                  <View style={styles.attendanceList}>
                    {activeDossierClient.package.attendanceHistory.map((att, idx) => (
                      <View key={att.id || idx} style={styles.attendanceRow}>
                        <View style={styles.attIndexBadge}>
                          <Text style={styles.attIndexText}>#{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attTopicText}>{att.topic}</Text>
                          <Text style={styles.attDateText}>
                            {att.date} • {att.timeSlot}
                          </Text>
                        </View>
                        <MaterialIcons name="check-circle" size={16} color="#89FE00" />
                      </View>
                    ))}
                  </View>
                </View>

                {/* 4. 🥗 NUTRITION & DIET PRESCRIPTION */}
                <View style={[styles.dossierSectionCard, { borderColor: 'rgba(137, 254, 0, 0.3)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="restaurant-menu" size={18} color="#89FE00" />
                      <Text style={[styles.dossierCardHeader, { color: '#89FE00', marginBottom: 0 }]}>
                        NUTRITION & MACRO PRESCRIPTION
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setDietTargetClientId(activeDossierClient.id);
                        setDietModalVisible(true);
                      }}
                      style={styles.dossierDietCtaBtn}>
                      <MaterialIcons name="edit" size={14} color="#000" />
                      <Text style={styles.dossierDietCtaBtnText}>
                        {activeDossierClient.dietPlan ? 'Adjust Plan' : 'Prescribe'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {activeDossierClient.dietPlan ? (
                    <View style={styles.dossierDietCard}>
                      <View style={styles.dossierDietTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dossierDietTitle}>{activeDossierClient.dietPlan.dietTitle}</Text>
                          <Text style={styles.dossierDietAssignedDate}>
                            Prescribed on {new Date(activeDossierClient.dietPlan.assignedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.dossierDietKcalBadge}>
                          <Text style={styles.dossierDietKcalVal}>{activeDossierClient.dietPlan.calories}</Text>
                          <Text style={styles.dossierDietKcalLbl}>KCAL</Text>
                        </View>
                      </View>

                      {/* MACROS ROW */}
                      <View style={styles.dossierDietMacrosRow}>
                        <View style={[styles.dossierDietMacroPill, { backgroundColor: 'rgba(137, 254, 0, 0.12)' }]}>
                          <Text style={[styles.dossierDietMacroVal, { color: '#89FE00' }]}>
                            {activeDossierClient.dietPlan.proteinG}g
                          </Text>
                          <Text style={styles.dossierDietMacroLbl}>Protein</Text>
                        </View>

                        <View style={[styles.dossierDietMacroPill, { backgroundColor: 'rgba(0, 180, 216, 0.12)' }]}>
                          <Text style={[styles.dossierDietMacroVal, { color: '#00B4D8' }]}>
                            {activeDossierClient.dietPlan.carbsG}g
                          </Text>
                          <Text style={styles.dossierDietMacroLbl}>Carbs</Text>
                        </View>

                        <View style={[styles.dossierDietMacroPill, { backgroundColor: 'rgba(255, 184, 0, 0.12)' }]}>
                          <Text style={[styles.dossierDietMacroVal, { color: '#FFB800' }]}>
                            {activeDossierClient.dietPlan.fatG}g
                          </Text>
                          <Text style={styles.dossierDietMacroLbl}>Fats</Text>
                        </View>

                        {activeDossierClient.dietPlan.waterIntakeLiters && (
                          <View style={[styles.dossierDietMacroPill, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
                            <Text style={[styles.dossierDietMacroVal, { color: '#A78BFA' }]}>
                              {activeDossierClient.dietPlan.waterIntakeLiters}L
                            </Text>
                            <Text style={styles.dossierDietMacroLbl}>Water</Text>
                          </View>
                        )}
                      </View>

                      {activeDossierClient.dietPlan.customNotes && (
                        <Text style={styles.dossierDietNotes}>
                          💡 <Text style={{ fontFamily: F.sansBold }}>Coach Directives: </Text>
                          {activeDossierClient.dietPlan.customNotes}
                        </Text>
                      )}

                      {activeDossierClient.dietPlan.supplementsList && activeDossierClient.dietPlan.supplementsList.length > 0 && (
                        <View style={styles.dossierDietSupsWrap}>
                          <Text style={styles.dossierDietSupsTitle}>Prescribed Supplements ({activeDossierClient.dietPlan.supplementsList.length}):</Text>
                          {activeDossierClient.dietPlan.supplementsList.map((sup, sIdx) => (
                            <Text key={sup.id || sIdx} style={styles.dossierDietSupItem}>
                              • <Text style={{ fontFamily: F.sansBold, color: C.onSurface }}>{sup.name}</Text> ({sup.dosage} - {sup.timing})
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.noDietCard}>
                      <MaterialIcons name="restaurant" size={20} color={C.onSurfaceVariant} />
                      <Text style={styles.noDietText}>
                        No active nutrition or macro protocol assigned yet. Tap "Prescribe" above to assign a Desi diet preset.
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* ➕ ENROLL ATHLETE MODAL */}
        <EnrollAthleteModal
          visible={addClientModalVisible}
          onClose={() => setAddClientModalVisible(false)}
        />

        {/* 🥗 COACH DIET & MACRO PRESCRIPTION MODAL */}
        <CoachDietPrescriptionModal
          visible={dietModalVisible}
          targetClientId={dietTargetClientId}
          onClose={() => setDietModalVisible(false)}
        />

        {/* 🔄 RENEW PACKAGE & RECORD PAYMENT MODAL */}
        <Modal visible={renewalModalVisible} animationType="slide" transparent onRequestClose={() => setRenewalModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.renewalModalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="payments" size={20} color="#89FE00" />
                  <Text style={styles.renewalModalTitle}>RENEW PT PACKAGE</Text>
                </View>
                <TouchableOpacity onPress={() => setRenewalModalVisible(false)} style={styles.closeBtnSmall}>
                  <MaterialIcons name="close" size={20} color={C.onSurface} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
                <Text style={styles.renewalClientNameText}>
                  Athlete: <Text style={{ color: '#89FE00' }}>{renewalTargetClient?.name}</Text>
                </Text>

                {/* PACKAGE SELECTION */}
                <View>
                  <Text style={styles.renewalFieldLabel}>SELECT PACKAGE TIER</Text>
                  <View style={styles.renewalTypeGrid}>
                    <TouchableOpacity
                      onPress={() => {
                        setRenewalPackageType('MONTHLY_12');
                        setRenewalPrice('15000');
                      }}
                      style={[styles.renewalTypeCard, renewalPackageType === 'MONTHLY_12' && styles.renewalTypeCardActive]}>
                      <Text style={[styles.renewalTypeTitle, renewalPackageType === 'MONTHLY_12' && { color: '#89FE00' }]}>
                        12 Sessions (1 Month)
                      </Text>
                      <Text style={styles.renewalTypePrice}>৳15,000 BDT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setRenewalPackageType('TRANSFORMATION_24');
                        setRenewalPrice('26000');
                      }}
                      style={[styles.renewalTypeCard, renewalPackageType === 'TRANSFORMATION_24' && styles.renewalTypeCardActive]}>
                      <Text style={[styles.renewalTypeTitle, renewalPackageType === 'TRANSFORMATION_24' && { color: '#89FE00' }]}>
                        24 Sessions (2 Months)
                      </Text>
                      <Text style={styles.renewalTypePrice}>৳26,000 BDT</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* PAYMENT METHOD */}
                <View>
                  <Text style={styles.renewalFieldLabel}>PAYMENT METHOD</Text>
                  <View style={styles.paymentMethodRow}>
                    {(['bKash', 'Nagad', 'Cash', 'Bank'] as PaymentMethod[]).map((m) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setRenewalMethod(m)}
                        style={[styles.paymentMethodChip, renewalMethod === m && styles.paymentMethodChipActive]}>
                        <Text style={[styles.paymentMethodChipText, renewalMethod === m && styles.paymentMethodChipTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* AMOUNT INPUT */}
                <View>
                  <Text style={styles.renewalFieldLabel}>AMOUNT RECEIVED (BDT)</Text>
                  <TextInput
                    style={styles.renewalInput}
                    value={renewalPrice}
                    onChangeText={setRenewalPrice}
                    keyboardType="numeric"
                    placeholder="15000"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                {/* TRANSACTION ID */}
                <View>
                  <Text style={styles.renewalFieldLabel}>TRANSACTION ID / REF (OPTIONAL)</Text>
                  <TextInput
                    style={styles.renewalInput}
                    value={renewalTrxId}
                    onChangeText={setRenewalTrxId}
                    placeholder="e.g. BK982341 or Cash Receipt #04"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                {/* CONFIRM BUTTON */}
                <TouchableOpacity onPress={handleConfirmRenewal} style={styles.confirmRenewalBtn}>
                  <MaterialIcons name="check-circle" size={18} color="#002233" />
                  <Text style={styles.confirmRenewalBtnText}>Confirm Renewal & Record Payment</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        {/* 💬 WHATSAPP SHARE CARD MODAL */}
        <WhatsAppShareCardModal
          visible={whatsappModalVisible}
          onClose={() => setWhatsappModalVisible(false)}
          client={whatsappTargetClient}
          mode={whatsappMode}
        />

        {/* 🔥 TRANSFORMATION PROOF BUILDER MODAL */}
        <TransformationProofBuilderModal
          visible={transformationModalVisible}
          onClose={() => setTransformationModalVisible(false)}
          client={transformationTargetClient}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TC.screenBg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: TC.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: TC.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TC.surfaceHighlightSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: TC.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
    marginTop: 1,
  },
  dietVaultHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.surfaceHighlightSoft,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  dietVaultHeaderBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: TC.forestDark,
  },
  addClientHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.btnPrimaryBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addClientHeaderBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: TC.btnPrimaryTextLime,
  },
  dietActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TC.surfaceCardMuted,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dietActivePillText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: TC.textPrimary,
    flex: 1,
  },
  dietUnassignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TC.surfaceHighlightSoft,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dietUnassignedPillText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: TC.forestDark,
  },
  cardDietBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.surfaceCardMuted,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cardDietBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: TC.forestDark,
  },
  dossierDietCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dossierDietCtaBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: TC.forestDark,
  },
  dossierDietCard: {
    backgroundColor: TC.surfaceCardMuted,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: TC.border,
  },
  dossierDietTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  dossierDietTitle: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: TC.textPrimary,
  },
  dossierDietAssignedDate: {
    fontFamily: F.sans,
    fontSize: 10,
    color: TC.textSecondary,
    marginTop: 2,
  },
  dossierDietKcalBadge: {
    backgroundColor: TC.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  dossierDietKcalVal: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: TC.forestDark,
  },
  dossierDietKcalLbl: {
    fontFamily: F.sansMedium,
    fontSize: 8,
    color: TC.forestDark,
  },
  dossierDietMacrosRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dossierDietMacroPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  dossierDietMacroVal: {
    fontFamily: F.sansBold,
    fontSize: 11,
  },
  dossierDietMacroLbl: {
    fontFamily: F.sans,
    fontSize: 9,
    color: TC.textSecondary,
  },
  dossierDietNotes: {
    fontFamily: F.sans,
    fontSize: 11,
    color: TC.textPrimary,
    lineHeight: 16,
  },
  dossierDietSupsWrap: {
    gap: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: TC.borderLight,
  },
  dossierDietSupsTitle: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: TC.forestDark,
    marginBottom: 2,
  },
  dossierDietSupItem: {
    fontFamily: F.sans,
    fontSize: 10,
    color: TC.textSecondary,
  },
  noDietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TC.surfaceCardMuted,
    padding: 12,
    borderRadius: 10,
  },
  noDietText: {
    flex: 1,
    fontFamily: F.sans,
    fontSize: 11,
    color: TC.textSecondary,
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  statsBento: {
    flexDirection: 'row',
    backgroundColor: TC.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TC.border,
    padding: 12,
    shadowColor: TC.forestDark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoItem: {
    flex: 1,
    alignItems: 'center',
  },
  bentoVal: {
    fontSize: 18,
    fontFamily: F.monoBold,
    color: TC.textPrimary,
  },
  bentoLbl: {
    fontSize: 10,
    fontFamily: F.sans,
    color: TC.textSecondary,
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TC.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.sans,
    color: TC.textPrimary,
  },
  goalChipsScroll: {
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TC.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: TC.border,
  },
  goalChipActive: {
    backgroundColor: TC.chipActiveBg,
    borderColor: TC.chipActiveBg,
  },
  goalChipText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: TC.textSecondary,
  },
  goalChipTextActive: {
    color: TC.chipActiveText,
    fontFamily: F.sansBold,
  },
  callIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TC.surfaceHighlight,
    borderWidth: 1,
    borderColor: TC.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientsSection: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: TC.textSecondary,
    letterSpacing: 0.8,
  },
  clientCard: {
    backgroundColor: TC.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TC.border,
    padding: 14,
    gap: 12,
    shadowColor: TC.forestDark,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  clientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TC.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(14, 77, 52, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitials: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: TC.forestDark,
  },
  clientCardName: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: TC.textPrimary,
  },
  clientAgeGender: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  clientCurrentPhase: {
    fontSize: 12,
    fontFamily: F.sans,
    color: TC.textSecondary,
    marginTop: 2,
  },
  goalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  goalBadgeText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    letterSpacing: 0.4,
  },
  injuryAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TC.warningRenewalBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: TC.warningRenewalBorder,
  },
  injuryAlertPillText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: TC.warningRenewalText,
  },
  cleanClearancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TC.surfaceHighlightSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: TC.border,
  },
  cleanClearancePillText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: TC.forestDark,
  },
  packageTrackWrap: {
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: TC.border,
  },
  packageTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTrackLabel: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  packageSessionsCount: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: TC.textSecondary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TC.progressTrack,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: TC.progressFill,
    borderRadius: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDossierBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.surfaceCardMuted,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: TC.border,
  },
  viewDossierBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: TC.forestDark,
  },
  punchSessionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: TC.btnPrimaryBg,
    borderRadius: 10,
    paddingVertical: 8,
  },
  punchSessionBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: TC.btnPrimaryTextLime,
  },
  dossierSectionCard: {
    backgroundColor: TC.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TC.border,
    padding: 14,
    gap: 10,
  },
  dossierCardHeader: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: TC.textPrimary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  weightProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    padding: 12,
  },
  weightItem: {
    alignItems: 'center',
  },
  weightVal: {
    fontSize: 16,
    fontFamily: F.monoBold,
    color: TC.textPrimary,
  },
  weightLbl: {
    fontSize: 10,
    fontFamily: F.sans,
    color: TC.textSecondary,
    marginTop: 2,
  },
  phaseInfoBox: {
    backgroundColor: TC.surfaceHighlightSoft,
    borderRadius: 10,
    padding: 10,
  },
  phaseInfoText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: TC.textPrimary,
  },
  parQStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parQStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parQStatusBadgeText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: TC.forestDark,
  },
  physicianNameText: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  injuryDetailsBox: {
    backgroundColor: TC.screenBg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: TC.urgentRenewalBorder,
  },
  injuryJointTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  injuryJointName: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: TC.textPrimary,
    flex: 1,
    marginLeft: 6,
  },
  severityBadge: {
    backgroundColor: TC.urgentRenewalBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: TC.urgentRenewalText,
  },
  contraindicatedCard: {
    backgroundColor: TC.urgentRenewalBg,
    borderRadius: 8,
    padding: 8,
  },
  contraindicatedTitle: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: TC.urgentRenewalText,
    marginBottom: 2,
  },
  contraindicatedItem: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.urgentRenewalText,
    marginLeft: 4,
  },
  safeAltCard: {
    backgroundColor: TC.surfaceHighlightSoft,
    borderRadius: 8,
    padding: 8,
  },
  safeAltTitle: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: TC.forestDark,
    marginBottom: 2,
  },
  safeAltItem: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.forestDark,
    marginLeft: 4,
  },
  injuryClinicalNotes: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
    lineHeight: 16,
  },
  noInjuriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TC.surfaceHighlightSoft,
    borderRadius: 10,
    padding: 10,
  },
  noInjuriesText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: TC.forestDark,
  },
  emergencyContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  emergencyContactText: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  packageSummaryRow: {
    flexDirection: 'row',
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    padding: 10,
  },
  pkgStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  pkgStatVal: {
    fontSize: 16,
    fontFamily: F.monoBold,
    color: TC.textPrimary,
  },
  pkgStatLbl: {
    fontSize: 10,
    fontFamily: F.sans,
    color: TC.textSecondary,
    marginTop: 2,
  },
  packageActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dossierPunchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.btnPrimaryBg,
    borderRadius: 12,
    paddingVertical: 10,
  },
  dossierPunchBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: TC.btnPrimaryTextLime,
  },
  dossierRenewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.surfaceHighlightSoft,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: TC.border,
  },
  dossierRenewBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: TC.forestDark,
  },
  attendanceHistoryTitle: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: TC.textSecondary,
    letterSpacing: 0.6,
    marginTop: 6,
  },
  attendanceList: {
    gap: 6,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TC.screenBg,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: TC.border,
  },
  attIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TC.surfaceHighlightSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attIndexText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: TC.forestDark,
  },
  attTopicText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: TC.textPrimary,
  },
  attDateText: {
    fontSize: 10,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  formCard: {
    backgroundColor: TC.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TC.border,
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: TC.textSecondary,
    marginTop: 4,
  },
  formInput: {
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TC.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: F.sans,
    color: TC.textPrimary,
  },
  goalSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalSelectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: TC.screenBg,
    borderWidth: 1,
    borderColor: TC.border,
  },
  goalSelectOptionText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: TC.textSecondary,
  },
  pkgSelectOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TC.border,
    backgroundColor: TC.screenBg,
    alignItems: 'center',
    gap: 2,
  },
  pkgSelectTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: TC.textPrimary,
  },
  pkgSelectPrice: {
    fontSize: 11,
    fontFamily: F.sans,
    color: TC.textSecondary,
  },
  createClientSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.btnPrimaryBg,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  createClientSubmitBtnText: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: TC.btnPrimaryTextLime,
  },
  renewalUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.urgentRenewalBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: TC.urgentRenewalBorder,
  },
  renewalUrgentText: {
    color: TC.urgentRenewalText,
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  renewalWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.warningRenewalBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: TC.warningRenewalBorder,
  },
  renewalWarningText: {
    color: TC.warningRenewalText,
    fontSize: 10,
    fontFamily: F.sansMedium,
  },
  cardWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.surfaceHighlightSoft,
    borderWidth: 1,
    borderColor: TC.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardWhatsAppBtnText: {
    color: TC.forestDark,
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  cardProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.surfaceCardMuted,
    borderWidth: 1,
    borderColor: TC.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardProofBtnText: {
    color: TC.forestDark,
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  cardRenewQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TC.urgentRenewalText,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cardRenewQuickBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  dossierFastShareRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dossierWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.surfaceHighlightSoft,
    borderWidth: 1,
    borderColor: TC.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  dossierWhatsAppBtnText: {
    color: TC.forestDark,
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  dossierProofBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: TC.surfaceCardMuted,
    borderWidth: 1,
    borderColor: TC.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  dossierProofBtnText: {
    color: TC.forestDark,
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  paymentRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TC.screenBg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: TC.border,
  },
  paymentMethodPill: {
    backgroundColor: TC.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMethodPillText: {
    color: TC.forestDark,
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  paymentAmountText: {
    color: TC.textPrimary,
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  paymentMetaText: {
    color: TC.textSecondary,
    fontSize: 10,
    fontFamily: F.sansRegular,
    marginTop: 1,
  },
  paymentNoteText: {
    color: TC.forestDark,
    fontSize: 10,
    fontFamily: F.sansMedium,
    marginTop: 1,
  },
  shareReceiptIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TC.surfaceHighlightSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPaymentNotice: {
    padding: 12,
    backgroundColor: TC.screenBg,
    borderRadius: 8,
    alignItems: 'center',
  },
  noPaymentNoticeText: {
    color: TC.textSecondary,
    fontSize: 11,
    fontFamily: F.sansRegular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 77, 52, 0.45)',
    justifyContent: 'flex-end',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TC.border,
  },
  renewalModalContent: {
    backgroundColor: TC.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  renewalModalTitle: {
    color: TC.textPrimary,
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  closeBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TC.surfaceHighlightSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renewalClientNameText: {
    color: TC.textPrimary,
    fontSize: 14,
    fontFamily: F.sansBold,
    marginBottom: 4,
  },
  renewalFieldLabel: {
    color: TC.textSecondary,
    fontSize: 10,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  renewalTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  renewalTypeCard: {
    flex: 1,
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: TC.border,
  },
  renewalTypeCardActive: {
    backgroundColor: TC.surfaceHighlightSoft,
    borderColor: TC.forestDark,
  },
  renewalTypeTitle: {
    color: TC.textPrimary,
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  renewalTypePrice: {
    color: TC.textSecondary,
    fontSize: 11,
    fontFamily: F.sansRegular,
    marginTop: 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentMethodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: TC.screenBg,
    borderWidth: 1,
    borderColor: TC.border,
    alignItems: 'center',
  },
  paymentMethodChipActive: {
    backgroundColor: TC.btnPrimaryBg,
    borderColor: TC.forestDark,
  },
  paymentMethodChipText: {
    color: TC.textSecondary,
    fontSize: 11,
    fontFamily: F.sansMedium,
  },
  paymentMethodChipTextActive: {
    color: TC.btnPrimaryTextLime,
    fontFamily: F.sansBold,
  },
  renewalInput: {
    backgroundColor: TC.screenBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TC.textPrimary,
    fontSize: 13,
    fontFamily: F.sansRegular,
    borderWidth: 1,
    borderColor: TC.border,
  },
  confirmRenewalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TC.btnPrimaryBg,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  confirmRenewalBtnText: {
    color: TC.btnPrimaryTextLime,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
});
