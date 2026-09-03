/**
 * Trainer Profile Modal — Certifications, Credentials & Transformation Showcase Studio
 * Accredited badges (CSCS, ACE, ISSA, CPR), Before/After stats, Coach Dossier
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { CoachPackagesManagerModal } from './coach-packages-manager-modal';
import type { TrainerCertification, ClientTransformation } from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type ActiveTab = 'CERTS' | 'TRANSFORMATIONS' | 'PACKAGES';

export function TrainerProfileModal({ visible, onClose }: Props) {
  const { profile, customPackages } = useTrainerStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('CERTS');
  const [selectedCert, setSelectedCert] = useState<TrainerCertification | null>(null);
  const [packagesManagerVisible, setPackagesManagerVisible] = useState(false);

  const handleShareDossier = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        title: `${profile.name} — Certified Master Coach`,
        message: `🏋️‍♂️ ${profile.name}\n${profile.bio}\n\n🏆 Certifications: CSCS (NSCA), ACE CPT, ISSA Master Trainer\n📍 Gym: ${profile.gymAffiliation}\n⭐ Rating: ${profile.rating.average} (${profile.rating.reviewCount} client reviews)\n📞 Contact: ${profile.phone}`,
      });
    } catch {
      // ignore
    }
  };

  const renderCertCard = (cert: TrainerCertification) => (
    <TouchableOpacity
      key={cert.id}
      activeOpacity={0.85}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setSelectedCert(cert);
      }}
      style={[styles.certCard, { borderColor: cert.color + '40' }]}>
      <View style={styles.certHeader}>
        <View style={[styles.certBadgeCode, { backgroundColor: cert.bg }]}>
          <MaterialIcons name="verified" size={16} color={cert.color} />
          <Text style={[styles.certBadgeCodeText, { color: cert.color }]}>
            {cert.badgeCode}
          </Text>
        </View>
        <View style={styles.verifiedPill}>
          <MaterialIcons name="check" size={12} color="#89FE00" />
          <Text style={styles.verifiedPillText}>VERIFIED</Text>
        </View>
      </View>

      <Text style={styles.certTitle}>{cert.title}</Text>
      <Text style={styles.certIssuer}>{cert.issuerFull}</Text>

      <View style={styles.certMetaRow}>
        <Text style={styles.certCredentialId}>ID: {cert.credentialId}</Text>
        {cert.expiryDate ? (
          <Text style={styles.certExpiry}>Valid Thru: {cert.expiryDate}</Text>
        ) : null}
      </View>

      <Text style={styles.certDescription}>{cert.description}</Text>
    </TouchableOpacity>
  );

  const renderTransformationCard = (trans: ClientTransformation) => (
    <View key={trans.id} style={styles.transCard}>
      <View style={styles.transHeader}>
        <View style={styles.transClientInfo}>
          <View style={styles.clientAvatarMini}>
            <Text style={styles.clientAvatarMiniText}>
              {trans.clientName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.transClientName}>{trans.clientName}, {trans.age}y</Text>
            <Text style={styles.transProgramName}>{trans.programName}</Text>
          </View>
        </View>
        <View style={styles.transTagBadge}>
          <Text style={styles.transTagText}>{trans.tag}</Text>
        </View>
      </View>

      {/* METRIC DELTAS BENTO */}
      <View style={styles.metricDeltasRow}>
        <View style={styles.metricDeltaBox}>
          <Text style={styles.metricDeltaLabel}>Start Weight</Text>
          <Text style={styles.metricDeltaValue}>{trans.startingWeightKg} kg</Text>
        </View>

        <View style={styles.metricDeltaArrow}>
          <MaterialIcons name="trending-flat" size={20} color="#89FE00" />
        </View>

        <View style={styles.metricDeltaBox}>
          <Text style={styles.metricDeltaLabel}>Current Weight</Text>
          <Text style={[styles.metricDeltaValue, { color: '#89FE00' }]}>
            {trans.currentWeightKg} kg
          </Text>
        </View>

        <View style={styles.metricDeltaBox}>
          <Text style={styles.metricDeltaLabel}>Duration</Text>
          <Text style={[styles.metricDeltaValue, { color: '#00B4D8' }]}>
            {trans.durationWeeks} Wks
          </Text>
        </View>
      </View>

      {/* EXTRA STATS */}
      <View style={styles.extraStatsRow}>
        {trans.bodyFatLossPercent ? (
          <View style={styles.extraStatPill}>
            <MaterialIcons name="local-fire-department" size={14} color="#FFB800" />
            <Text style={styles.extraStatText}>-{trans.bodyFatLossPercent}% Body Fat</Text>
          </View>
        ) : null}
        {trans.muscleGainKg ? (
          <View style={styles.extraStatPill}>
            <MaterialIcons name="fitness-center" size={14} color="#89FE00" />
            <Text style={styles.extraStatText}>+{trans.muscleGainKg} kg Lean Muscle</Text>
          </View>
        ) : null}
      </View>

      {/* STORY & TESTIMONIAL */}
      <View style={styles.storyBox}>
        <Text style={styles.storyText}>"{trans.story}"</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons name="military-tech" size={24} color="#FFB800" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Trainer Profile & Credentials</Text>
                <Text style={styles.modalSubtitle}>CSCS, ACE & ISSA Accredited Coach</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* HERO COACH CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.coachAvatar}>
                  <MaterialIcons name="fitness-center" size={28} color="#89FE00" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.coachName}>{profile.name}</Text>
                    <MaterialIcons name="verified" size={18} color="#00B4D8" />
                  </View>
                  <Text style={styles.gymName}>📍 {profile.gymAffiliation}</Text>
                  <Text style={styles.coachPhone}>📞 {profile.phone}</Text>
                </View>
              </View>

              <Text style={styles.coachBio}>{profile.bio}</Text>

              {/* COACH STATS PILLS */}
              <View style={styles.coachStatsRow}>
                <View style={styles.coachStatPill}>
                  <Text style={styles.coachStatVal}>{profile.yearsOfExperience}+ Yrs</Text>
                  <Text style={styles.coachStatLbl}>Experience</Text>
                </View>
                <View style={styles.coachStatPill}>
                  <Text style={styles.coachStatVal}>{profile.totalClientsCoached}+</Text>
                  <Text style={styles.coachStatLbl}>Clients</Text>
                </View>
                <View style={styles.coachStatPill}>
                  <Text style={[styles.coachStatVal, { color: '#89FE00' }]}>
                    {profile.rating.average} ⭐
                  </Text>
                  <Text style={styles.coachStatLbl}>({profile.rating.reviewCount} Reviews)</Text>
                </View>
              </View>

              {/* SHARE PROFILE BUTTON */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleShareDossier} style={styles.shareBtn}>
                <MaterialIcons name="share" size={16} color="#002233" />
                <Text style={styles.shareBtnText}>Share Coach Profile Dossier</Text>
              </TouchableOpacity>
            </View>

            {/* SPECIALTIES TAGS */}
            <View style={styles.specialtiesSection}>
              <Text style={styles.sectionHeader}>COACHING SPECIALTIES & METHODOLOGY</Text>
              <View style={styles.specialtiesWrap}>
                {profile.specialties.map((spec) => (
                  <View key={spec} style={styles.specTag}>
                    <MaterialIcons name="check-circle" size={12} color="#89FE00" />
                    <Text style={styles.specTagText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* SUB-TABS SELECTOR */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('CERTS')}
                style={[styles.tabBtn, activeTab === 'CERTS' && styles.tabBtnActive]}>
                <MaterialIcons
                  name="workspace-premium"
                  size={16}
                  color={activeTab === 'CERTS' ? '#89FE00' : C.onSurfaceVariant}
                />
                <Text style={[styles.tabBtnText, activeTab === 'CERTS' && styles.tabBtnTextActive]}>
                  Certifications ({profile.certifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('TRANSFORMATIONS')}
                style={[styles.tabBtn, activeTab === 'TRANSFORMATIONS' && styles.tabBtnActive]}>
                <MaterialIcons
                  name="auto-graph"
                  size={16}
                  color={activeTab === 'TRANSFORMATIONS' ? '#00B4D8' : C.onSurfaceVariant}
                />
                <Text style={[styles.tabBtnText, activeTab === 'TRANSFORMATIONS' && styles.tabBtnTextActive]}>
                  Transformations ({profile.transformations.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('PACKAGES')}
                style={[styles.tabBtn, activeTab === 'PACKAGES' && styles.tabBtnActive]}>
                <MaterialIcons
                  name="payments"
                  size={16}
                  color={activeTab === 'PACKAGES' ? '#FFB800' : C.onSurfaceVariant}
                />
                <Text style={[styles.tabBtnText, activeTab === 'PACKAGES' && styles.tabBtnTextActive]}>
                  PT Rates
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENTS */}
            {activeTab === 'CERTS' ? (
              <View style={{ gap: 12 }}>
                {profile.certifications.map(renderCertCard)}
              </View>
            ) : activeTab === 'TRANSFORMATIONS' ? (
              <View style={{ gap: 14 }}>
                {profile.transformations.map(renderTransformationCard)}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.packagesHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageTitle}>Personal Training (PT) Packages</Text>
                    <Text style={styles.packageDesc}>
                      Structured 1-on-1 coaching at {profile.gymAffiliation} with customized workout & diet plans.
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setPackagesManagerVisible(true);
                    }}
                    style={styles.managePkgBtn}>
                    <MaterialIcons name="tune" size={16} color="#000" />
                    <Text style={styles.managePkgBtnText}>Manage Rates</Text>
                  </TouchableOpacity>
                </View>

                {customPackages.map((pkg) => {
                  const accentColor = pkg.color || '#89FE00';
                  const perSession =
                    pkg.sessionsCount > 0 ? Math.round(pkg.priceBdt / pkg.sessionsCount) : pkg.priceBdt;

                  return (
                    <View
                      key={pkg.id}
                      style={[
                        styles.rateItem,
                        pkg.isPopular && styles.rateItemFeatured,
                        { borderColor: accentColor + '40' },
                      ]}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {pkg.tag && (
                            <View style={[styles.popularBadge, { backgroundColor: accentColor }]}>
                              <Text style={[styles.popularBadgeText, { color: '#000' }]}>{pkg.tag}</Text>
                            </View>
                          )}
                          <Text style={styles.rateItemTitle}>{pkg.title}</Text>
                        </View>
                        <Text style={styles.rateItemSub}>
                          {pkg.sessionsCount} Sessions • {pkg.frequencyPerWeek} • {pkg.durationDays} Days
                        </Text>
                        <View style={{ gap: 2, marginTop: 4 }}>
                          {pkg.features.slice(0, 3).map((f, i) => (
                            <Text key={i} style={styles.featureBullet}>
                              ✓ {f}
                            </Text>
                          ))}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={[styles.rateItemPrice, { color: accentColor }]}>
                          ৳{pkg.priceBdt.toLocaleString()}
                        </Text>
                        <Text style={styles.perSessionSub}>৳{perSession.toLocaleString()} / session</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ⚙️ COACH CUSTOM PACKAGES MANAGER MODAL */}
      <CoachPackagesManagerModal
        visible={packagesManagerVisible}
        onClose={() => setPackagesManagerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#89FE00',
  },
  coachName: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  gymName: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: '#00B4D8',
    marginTop: 2,
  },
  coachPhone: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  coachBio: {
    fontSize: 13,
    fontFamily: F.sans,
    color: C.onSurface,
    lineHeight: 18,
  },
  coachStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coachStatPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  coachStatVal: {
    fontSize: 15,
    fontFamily: F.monoBold,
    color: C.onSurface,
  },
  coachStatLbl: {
    fontSize: 10,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#002233',
  },
  specialtiesSection: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: C.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  specTagText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurface,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBtnText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.sansBold,
    color: C.onSurface,
  },

  // CERT CARD
  certCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    gap: 8,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certBadgeCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  certBadgeCodeText: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 9,
    fontFamily: F.sansBold,
    color: '#89FE00',
    letterSpacing: 0.5,
  },
  certTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  certIssuer: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  certMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  certCredentialId: {
    fontSize: 11,
    fontFamily: F.mono,
    color: '#00B4D8',
  },
  certExpiry: {
    fontSize: 11,
    fontFamily: F.mono,
    color: C.onSurfaceVariant,
  },
  certDescription: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },

  // TRANSFORMATION CARD
  transCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  transHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clientAvatarMiniText: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: '#00B4D8',
  },
  transClientName: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  transProgramName: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  transTagBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transTagText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#00B4D8',
  },
  metricDeltasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
  },
  metricDeltaBox: {
    alignItems: 'center',
  },
  metricDeltaLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
  },
  metricDeltaValue: {
    fontSize: 14,
    fontFamily: F.monoBold,
    color: C.onSurface,
    marginTop: 2,
  },
  metricDeltaArrow: {
    paddingHorizontal: 4,
  },
  extraStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  extraStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  extraStatText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: C.onSurface,
  },
  storyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#89FE00',
  },
  storyText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // PACKAGES CARD
  packagesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  packageTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  packageDesc: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rateItemFeatured: {
    borderColor: 'rgba(137, 254, 0, 0.3)',
    backgroundColor: 'rgba(137, 254, 0, 0.04)',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(137, 254, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  popularBadgeText: {
    fontSize: 9,
    fontFamily: F.sansBold,
    color: '#89FE00',
  },
  rateItemTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  rateItemSub: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  rateItemPrice: {
    fontSize: 16,
    fontFamily: F.monoBold,
    color: C.onSurface,
  },
  packagesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  managePkgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  managePkgBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#000',
  },
  featureBullet: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: C.onSurfaceVariant,
  },
  perSessionSub: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
});
