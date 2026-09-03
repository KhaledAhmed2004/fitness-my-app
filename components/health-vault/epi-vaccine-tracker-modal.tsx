import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  ChildScheduledVaccine,
  ElderlyVaccineView,
  generateChildEpiSchedule,
  generateElderlyVaccineSchedule,
} from '@/services/epi-vaccine-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';

const C = Vital.colors;
const F = Vital.fonts;

interface EpiVaccineTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  initialMemberId?: string;
}

type MainTab = 'CHILD_EPI' | 'ELDERLY_ADULT' | 'DIGITAL_CARD';

export function EpiVaccineTrackerModal({
  visible,
  onClose,
  initialMemberId,
}: EpiVaccineTrackerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const vaccinations = useHealthVaultStore((s) => s.vaccinations);
  const addVaccination = useHealthVaultStore((s) => s.addVaccination);
  const deleteVaccination = useHealthVaultStore((s) => s.deleteVaccination);

  const [activeTab, setActiveTab] = useState<MainTab>('CHILD_EPI');

  // Selected Target Member
  const [currentMemberId, setCurrentMemberId] = useState<string>(
    initialMemberId || (selectedMemberId === 'ALL' ? members[0]?.id || 'mem_1' : selectedMemberId)
  );

  const targetMember = useMemo(() => {
    return members.find((m) => m.id === currentMemberId) || members[0];
  }, [members, currentMemberId]);

  // Child Date of Birth State (defaults to 3 months ago for demo/calculation if not set)
  const defaultDob = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90); // 3 months old
    return d.toISOString().split('T')[0];
  }, []);

  const [childDob, setChildDob] = useState<string>(defaultDob);
  const [isEditingDob, setIsEditingDob] = useState<boolean>(false);
  const [tempDobInput, setTempDobInput] = useState<string>(defaultDob);

  // Mark Completed Dialog State
  const [targetVaccine, setTargetVaccine] = useState<ChildScheduledVaccine | null>(null);
  const [completedDate, setCompletedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [providerName, setProviderName] = useState<string>('সরকারি ইপিআই টিকাদান কেন্দ্র (EPI Center)');
  const [batchNo, setBatchNo] = useState<string>('');

  // Child EPI Schedule Report
  const childReport = useMemo(() => {
    const memberVaccines = vaccinations.filter(
      (v) => v.memberId === currentMemberId
    );
    return generateChildEpiSchedule(
      targetMember?.name || 'শিশু',
      childDob,
      memberVaccines
    );
  }, [currentMemberId, targetMember, childDob, vaccinations]);

  // Elderly Vaccine Views
  const elderlyViews: ElderlyVaccineView[] = useMemo(() => {
    const memberVaccines = vaccinations.filter(
      (v) => v.memberId === currentMemberId
    );
    return generateElderlyVaccineSchedule(memberVaccines);
  }, [currentMemberId, vaccinations]);

  const handleSaveCompletedVaccine = async () => {
    if (!targetVaccine) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await addVaccination({
      memberId: currentMemberId,
      vaccineName: `${targetVaccine.code} - ${targetVaccine.nameEn}`,
      doseNumber: 1,
      vaccinationDate: completedDate || new Date().toISOString().split('T')[0],
      providerName: providerName.trim() || undefined,
      batchNumber: batchNo.trim() || undefined,
      notes: `EPI Schedule milestone: ${targetVaccine.diseaseBn}`,
    });

    setTargetVaccine(null);
    setBatchNo('');
  };

  const handleLogElderlyVaccine = async (eld: ElderlyVaccineView) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await addVaccination({
      memberId: currentMemberId,
      vaccineName: `${eld.item.code} - ${eld.item.nameEn}`,
      doseNumber: 1,
      vaccinationDate: new Date().toISOString().split('T')[0],
      providerName: 'হসপিটাল / ডায়াগনস্টিক সেন্টার',
      notes: eld.item.importanceBn,
    });
  };

  const handleShareDigitalCard = async () => {
    const summaryLines = [
      `🇧🇩 গণপ্রজাতন্ত্রী বাংলাদেশ সরকার - ডিজিটাল ইপিআই টিকা কার্ড`,
      `শিশুর নাম: ${targetMember?.name || 'শিশু'}`,
      `জন্মতারিখ: ${childDob}`,
      `মোট নির্ধারিত ডোজ: ${childReport.totalDosesCount}টি`,
      `সম্পন্ন হয়েছে: ${childReport.completedDosesCount}টি (${childReport.adherencePercentage}%)`,
      `---------------------------------`,
      ...childReport.milestones.flatMap((m) =>
        m.vaccines.map(
          (v) =>
            `• [${v.isCompleted ? '✓ সম্পন্ন' : 'অপেক্ষমান'}] ${v.nameBn} (${v.code}) - ${v.scheduledDateStr}`
        )
      ),
      `---------------------------------`,
      `যাচাইকৃত: Track-Me Digital Health Vault`,
    ].join('\n');

    try {
      await Share.share({
        message: summaryLines,
        title: `${targetMember?.name || 'শিশু'} - EPI টিকা সার্টিফিকেট`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="vaccines" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>EPI & Elderly Vaccine Vault</Text>
                <Text style={styles.subtitle}>
                  সরকারি ইপিআই ও ৫০+ টিকা ক্যালেন্ডার
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* FAMILY MEMBER CHIPS */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}
            >
              {members.map((m) => {
                const isSelected = currentMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setCurrentMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && styles.memberChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && styles.memberChipTextActive,
                      ]}
                    >
                      👤 {m.name} ({m.relation})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('CHILD_EPI')}
              style={[
                styles.tabBtn,
                activeTab === 'CHILD_EPI' && styles.tabBtnActive,
              ]}
            >
              <MaterialIcons
                name="child-care"
                size={16}
                color={activeTab === 'CHILD_EPI' ? '#20C997' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'CHILD_EPI' && styles.tabBtnTextActive,
                ]}
              >
                👶 শিশু ইপিআই (EPI)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('ELDERLY_ADULT')}
              style={[
                styles.tabBtn,
                activeTab === 'ELDERLY_ADULT' && styles.tabBtnActive,
              ]}
            >
              <MaterialIcons
                name="elderly"
                size={16}
                color={
                  activeTab === 'ELDERLY_ADULT'
                    ? '#20C997'
                    : C.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'ELDERLY_ADULT' && styles.tabBtnTextActive,
                ]}
              >
                🧓 ৫০+ বয়স্কদের টিকা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DIGITAL_CARD')}
              style={[
                styles.tabBtn,
                activeTab === 'DIGITAL_CARD' && styles.tabBtnActive,
              ]}
            >
              <MaterialIcons
                name="badge"
                size={16}
                color={
                  activeTab === 'DIGITAL_CARD'
                    ? '#20C997'
                    : C.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DIGITAL_CARD' && styles.tabBtnTextActive,
                ]}
              >
                📜 ডিজিটাল কার্ড
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'CHILD_EPI' && (
              <>
                {/* CHILD DOB & PROGRESS HERO */}
                <View style={styles.childHeroCard}>
                  <View style={styles.childHeroTop}>
                    <View style={styles.childAvatarBox}>
                      <Text style={{ fontSize: 24 }}>👶</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childName}>
                        {targetMember?.name || 'শিশু'}
                      </Text>
                      {isEditingDob ? (
                        <View style={styles.dobEditRow}>
                          <TextInput
                            style={styles.dobInput}
                            value={tempDobInput}
                            onChangeText={setTempDobInput}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={C.onSurfaceVariant}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              if (tempDobInput.trim()) {
                                setChildDob(tempDobInput.trim());
                              }
                              setIsEditingDob(false);
                            }}
                            style={styles.dobSaveBtn}
                          >
                            <Text style={styles.dobSaveText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setTempDobInput(childDob);
                            setIsEditingDob(true);
                          }}
                          style={styles.dobDisplayRow}
                        >
                          <MaterialIcons name="cake" size={14} color="#20C997" />
                          <Text style={styles.dobText}>
                            জন্মতারিখ: {childDob} (ট্যাপ করে পরিবর্তন)
                          </Text>
                          <MaterialIcons name="edit" size={12} color="#20C997" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* STATS COUNTER */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statNumber}>
                        {childReport.completedDosesCount}/{childReport.totalDosesCount}
                      </Text>
                      <Text style={styles.statLabel}>টিকা সম্পন্ন</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text
                        style={[
                          styles.statNumber,
                          childReport.overdueDosesCount > 0 && { color: '#EF4444' },
                        ]}
                      >
                        {childReport.overdueDosesCount}টি
                      </Text>
                      <Text style={styles.statLabel}>বাকি / Overdue</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text style={[styles.statNumber, { color: '#20C997' }]}>
                        {childReport.adherencePercentage}%
                      </Text>
                      <Text style={styles.statLabel}>কভারেজ রেট</Text>
                    </View>
                  </View>

                  {/* NEXT UPCOMING ALERT */}
                  {childReport.nextUpcomingVaccine && (
                    <View style={styles.nextDueAlert}>
                      <MaterialIcons name="alarm" size={16} color="#FF922B" />
                      <Text style={styles.nextDueText} numberOfLines={1}>
                        পরবর্তী টিকা: {childReport.nextUpcomingVaccine.nameBn} •{' '}
                        {childReport.nextUpcomingVaccine.statusTextBn}
                      </Text>
                    </View>
                  )}
                </View>

                {/* MILESTONE TIMELINE LIST */}
                <Text style={styles.sectionHeaderTitle}>
                  🇧🇩 বাংলাদেশ স্বাস্থ্য অধিদপ্তর (DGHS) সরকারি ইপিআই ক্যালেন্ডার
                </Text>

                {childReport.milestones.map((milestone) => (
                  <View key={milestone.milestoneId} style={styles.milestoneCard}>
                    {/* Milestone Header */}
                    <View style={styles.milestoneHeader}>
                      <View style={styles.milestoneHeaderLeft}>
                        <View
                          style={[
                            styles.milestoneDot,
                            milestone.allCompleted
                              ? { backgroundColor: '#20C997' }
                              : milestone.milestoneStatus === 'OVERDUE'
                              ? { backgroundColor: '#EF4444' }
                              : { backgroundColor: '#FF922B' },
                          ]}
                        />
                        <View>
                          <Text style={styles.milestoneTitle}>
                            {milestone.milestoneLabelBn}
                          </Text>
                          <Text style={styles.milestoneSub}>
                            নির্ধারিত তারিখ: {milestone.scheduledDateStr}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.milestoneStatusBadge,
                          milestone.allCompleted
                            ? styles.badgeSuccess
                            : milestone.milestoneStatus === 'OVERDUE'
                            ? styles.badgeDanger
                            : styles.badgeWarning,
                        ]}
                      >
                        <Text
                          style={[
                            styles.milestoneStatusBadgeText,
                            milestone.allCompleted
                              ? { color: '#20C997' }
                              : milestone.milestoneStatus === 'OVERDUE'
                              ? { color: '#EF4444' }
                              : { color: '#FF922B' },
                          ]}
                        >
                          {milestone.milestoneStatusTextBn}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.milestoneDesc}>
                      {milestone.descriptionBn}
                    </Text>

                    {/* Vaccine Items */}
                    <View style={styles.vaccineList}>
                      {milestone.vaccines.map((v) => (
                        <View key={v.code} style={styles.vaccineItemCard}>
                          <View style={styles.vaccineItemTop}>
                            <View style={{ flex: 1 }}>
                              <View style={styles.vaccineNameRow}>
                                <Text style={styles.vaccineNameBn}>
                                  {v.nameBn}
                                </Text>
                                <View style={styles.codeBadge}>
                                  <Text style={styles.codeBadgeText}>
                                    {v.code}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.vaccineDisease}>
                                🛡️ {v.diseaseBn}
                              </Text>
                              <Text style={styles.vaccineRoute}>
                                💉 {v.routeBn} ({v.doseCountText})
                              </Text>
                            </View>

                            {/* Action Button */}
                            {v.isCompleted ? (
                              <View style={styles.completedBox}>
                                <MaterialIcons
                                  name="check-circle"
                                  size={22}
                                  color="#20C997"
                                />
                                <Text style={styles.completedText}>সম্পন্ন</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                  setTargetVaccine(v);
                                }}
                                style={[
                                  styles.markTakenBtn,
                                  v.status === 'OVERDUE' && styles.markTakenBtnOverdue,
                                ]}
                              >
                                <MaterialIcons
                                  name="add-task"
                                  size={14}
                                  color="#FFF"
                                />
                                <Text style={styles.markTakenBtnText}>
                                  টিকা দিয়েছি
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          <View style={styles.vaccineItemBottom}>
                            <Text
                              style={[
                                styles.statusDetailText,
                                v.isCompleted
                                  ? { color: '#20C997' }
                                  : v.status === 'OVERDUE'
                                  ? { color: '#EF4444' }
                                  : { color: C.onSurfaceVariant },
                              ]}
                            >
                              {v.statusTextBn}
                            </Text>
                            {v.criticalNotesBn ? (
                              <Text style={styles.notesText}>
                                💡 {v.criticalNotesBn}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'ELDERLY_ADULT' && (
              <>
                {/* ELDERLY BANNER */}
                <View style={styles.elderlyHeroCard}>
                  <Text style={styles.elderlyHeroTitle}>
                    🧓 ৫০+ বয়স্ক ও ক্রনিক রোগীদের টিকা নির্দেশিকা
                  </Text>
                  <Text style={styles.elderlyHeroSub}>
                    বয়স বৃদ্ধির সাথে সাথে রোগ প্রতিরোধ ক্ষমতা কমে যায়। নিউমোনিয়া,
                    ইনফ্লুয়েঞ্জা ও হার্পিস জস্টারের টিকা হাসপাতালে ভর্তির ঝুঁকি ৭০%
                    কমায়।
                  </Text>
                </View>

                {elderlyViews.map((eld) => (
                  <View key={eld.item.id} style={styles.elderlyCard}>
                    <View style={styles.elderlyTop}>
                      <View style={styles.elderlyIconWrap}>
                        <MaterialIcons name="health-and-safety" size={22} color="#00B4D8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.elderlyNameBn}>{eld.item.nameBn}</Text>
                        <Text style={styles.elderlyNameEn}>{eld.item.nameEn}</Text>
                      </View>

                      {eld.isCompleted ? (
                        <View style={styles.completedBadgePill}>
                          <MaterialIcons name="check" size={14} color="#20C997" />
                          <Text style={styles.completedBadgePillText}>দেওয়া আছে</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleLogElderlyVaccine(eld)}
                          style={styles.elderlyLogBtn}
                        >
                          <MaterialIcons name="add" size={14} color="#00B4D8" />
                          <Text style={styles.elderlyLogBtnText}>লগ করুন</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.elderlyDetailBox}>
                      <View style={styles.elderlyRow}>
                        <Text style={styles.elderlyLabel}>টার্গেট গ্রুপ:</Text>
                        <Text style={styles.elderlyVal}>{eld.item.targetGroupBn}</Text>
                      </View>
                      <View style={styles.elderlyRow}>
                        <Text style={styles.elderlyLabel}>গ্রহণের নিয়ম:</Text>
                        <Text style={styles.elderlyVal}>{eld.item.frequencyBn}</Text>
                      </View>
                      <View style={styles.elderlyRow}>
                        <Text style={styles.elderlyLabel}>রোগ প্রতিরোধ:</Text>
                        <Text style={styles.elderlyVal}>{eld.item.diseaseBn}</Text>
                      </View>
                    </View>

                    <View style={styles.elderlyTipBox}>
                      <Text style={styles.elderlyTipText}>
                        💡 {eld.item.importanceBn}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'DIGITAL_CARD' && (
              <>
                {/* DIGITAL CERTIFICATE PASSPORT */}
                <View style={styles.certificateCard}>
                  {/* Certificate Header */}
                  <View style={styles.certHeader}>
                    <Text style={styles.certGovtTitle}>
                      গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                    </Text>
                    <Text style={styles.certDeptTitle}>
                      স্বাস্থ্য অধিদপ্তর (DGHS) • জাতীয় টিকাদান কর্মসূচি (EPI)
                    </Text>
                    <Text style={styles.certCardTitle}>ডিজিটাল টিকা কার্ড</Text>
                  </View>

                  <View style={styles.certDivider} />

                  {/* Child Info */}
                  <View style={styles.certInfoGrid}>
                    <View style={styles.certInfoCol}>
                      <Text style={styles.certInfoLabel}>শিশুর নাম:</Text>
                      <Text style={styles.certInfoValue}>
                        {targetMember?.name || 'শিশু'}
                      </Text>
                    </View>
                    <View style={styles.certInfoCol}>
                      <Text style={styles.certInfoLabel}>জন্মতারিখ:</Text>
                      <Text style={styles.certInfoValue}>{childDob}</Text>
                    </View>
                    <View style={styles.certInfoCol}>
                      <Text style={styles.certInfoLabel}>অভিভাবক:</Text>
                      <Text style={styles.certInfoValue}>
                        {targetMember?.relation || 'পিতা/মাতা'}
                      </Text>
                    </View>
                    <View style={styles.certInfoCol}>
                      <Text style={styles.certInfoLabel}>স্ট্যাটাস:</Text>
                      <Text
                        style={[
                          styles.certInfoValue,
                          { color: childReport.adherencePercentage === 100 ? '#20C997' : '#FF922B' },
                        ]}
                      >
                        {childReport.adherencePercentage}% কভারেজ
                      </Text>
                    </View>
                  </View>

                  {/* Summary Table */}
                  <View style={styles.certTable}>
                    <View style={styles.certTableHeader}>
                      <Text style={[styles.certTh, { flex: 1.5 }]}>টিকার নাম</Text>
                      <Text style={[styles.certTh, { flex: 1 }]}>নির্ধারিত বয়স</Text>
                      <Text style={[styles.certTh, { flex: 1.2 }]}>তারিখ / স্ট্যাটাস</Text>
                    </View>

                    {childReport.milestones.flatMap((m) =>
                      m.vaccines.map((v) => (
                        <View key={v.code} style={styles.certTableRow}>
                          <Text style={[styles.certTd, { flex: 1.5, fontFamily: F.bold }]}>
                            {v.nameBn} ({v.code})
                          </Text>
                          <Text style={[styles.certTd, { flex: 1 }]}>
                            {m.milestoneLabelBn.split('(')[0]}
                          </Text>
                          <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {v.isCompleted ? (
                              <>
                                <MaterialIcons name="verified" size={14} color="#20C997" />
                                <Text style={[styles.certTd, { color: '#20C997', fontFamily: F.bold }]}>
                                  {v.completedDate || 'গৃহীত'}
                                </Text>
                              </>
                            ) : (
                              <Text style={[styles.certTd, { color: '#EF4444' }]}>
                                অপেক্ষমান
                              </Text>
                            )}
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Certificate Seal & QR note */}
                  <View style={styles.certFooter}>
                    <View style={styles.sealBox}>
                      <MaterialIcons name="verified-user" size={28} color="#D4AF37" />
                      <Text style={styles.sealText}>DIGITAL SEAL</Text>
                    </View>
                    <Text style={styles.certFooterNote}>
                      এই কার্ডটি স্কুল ভর্তি, বিদেশ ভ্রমণ বা চিকিৎসকের প্রয়োজনে ডিজিটাল
                      ইমিউনাইজেশন রেকর্ড হিসেবে প্রদর্শনযোগ্য।
                    </Text>
                  </View>
                </View>

                {/* SHARE BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleShareDigitalCard}
                  style={styles.shareBtn}
                >
                  <MaterialIcons name="share" size={18} color="#00344D" />
                  <Text style={styles.shareBtnText}>
                    টিকা কার্ড শেয়ার বা কপি করুন (Share Card)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* SAFETY & CARE TIPS */}
            <View style={styles.safetyCard}>
              <View style={styles.safetyTitleRow}>
                <MaterialIcons name="info-outline" size={18} color="#FCC419" />
                <Text style={styles.safetyTitle}>টিকা পরবর্তী জরুরি পরামর্শ</Text>
              </View>
              <Text style={styles.safetyBody}>
                • টিকার পর মৃদু জ্বর বা কান্নাকাটি হওয়া স্বাভাবিক। চিকিৎসকের পরামর্শ অনুযায়ী প্যারাসিটামল ড্রপ খাওয়াতে পারেন।{'\n'}
                • বিসিজি টিকার স্থানে গোল লাল দানা ও সামান্য পুঁজ হতে পারে; কখনোই টিপবেন না বা মলম লাগাবেন না।{'\n'}
                • সরকারি ইপিআই সেন্টারে সব শিশুর টিকা সম্পূর্ণ বিনামূল্যে প্রদান করা হয়।
              </Text>
            </View>
          </ScrollView>

          {/* MARK TAKEN DIALOG MODAL */}
          {targetVaccine && (
            <Modal
              visible={!!targetVaccine}
              transparent
              animationType="fade"
              onRequestClose={() => setTargetVaccine(null)}
            >
              <View style={styles.dialogOverlay}>
                <View style={styles.dialogCard}>
                  <View style={styles.dialogHeader}>
                    <Text style={styles.dialogTitle}>টিকা গ্রহণের তথ্য সংরক্ষণ</Text>
                    <TouchableOpacity onPress={() => setTargetVaccine(null)}>
                      <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.dialogVacName}>
                    {targetVaccine.nameBn} ({targetVaccine.code})
                  </Text>
                  <Text style={styles.dialogVacSub}>
                    প্রতিরোধ: {targetVaccine.diseaseBn}
                  </Text>

                  <View style={styles.dialogInputGroup}>
                    <Text style={styles.dialogInputLabel}>টিকা প্রদানের তারিখ (YYYY-MM-DD):</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={completedDate}
                      onChangeText={setCompletedDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.dialogInputGroup}>
                    <Text style={styles.dialogInputLabel}>কেন্দ্র / হাসপাতালের নাম:</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={providerName}
                      onChangeText={setProviderName}
                      placeholder="e.g. ঢাকা মেডিকেল / স্থানীয় ইপিআই কেন্দ্র"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.dialogInputGroup}>
                    <Text style={styles.dialogInputLabel}>ব্যাচ নম্বর (ঐচ্ছিক):</Text>
                    <TextInput
                      style={styles.dialogInput}
                      value={batchNo}
                      onChangeText={setBatchNo}
                      placeholder="e.g. BATCH-2026-X"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.dialogActions}>
                    <TouchableOpacity
                      onPress={() => setTargetVaccine(null)}
                      style={styles.dialogCancelBtn}
                    >
                      <Text style={styles.dialogCancelText}>বাতিল</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveCompletedVaccine}
                      style={styles.dialogConfirmBtn}
                    >
                      <Text style={styles.dialogConfirmText}>সংরক্ষণ করুন</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '92%',
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
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
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  membersScroll: {
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  memberChipActive: {
    backgroundColor: '#20C997',
    borderColor: '#20C997',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  memberChipTextActive: {
    fontFamily: F.bold,
    color: '#00344D',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    borderColor: 'rgba(32, 201, 151, 0.3)',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#20C997',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  childHeroCard: {
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.25)',
    gap: 12,
  },
  childHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  childAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(32, 201, 151, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  dobDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dobText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#20C997',
  },
  dobEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dobInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    color: C.onSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: F.medium,
    borderWidth: 1,
    borderColor: '#20C997',
    width: 110,
  },
  dobSaveBtn: {
    backgroundColor: '#20C997',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dobSaveText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#00344D',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextDueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 146, 43, 0.3)',
  },
  nextDueText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FF922B',
    flex: 1,
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginHorizontal: 4,
  },
  milestoneCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  milestoneTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  milestoneSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  milestoneStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
  },
  milestoneStatusBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  milestoneDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  vaccineList: {
    gap: 8,
    marginTop: 4,
  },
  vaccineItemCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  vaccineItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  vaccineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaccineNameBn: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  codeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  vaccineDisease: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 2,
  },
  vaccineRoute: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  completedBox: {
    alignItems: 'center',
    gap: 2,
  },
  completedText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  markTakenBtn: {
    backgroundColor: '#20C997',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markTakenBtnOverdue: {
    backgroundColor: '#EF4444',
  },
  markTakenBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#00344D',
  },
  vaccineItemBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 4,
    gap: 2,
  },
  statusDetailText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    lineHeight: 13,
  },
  elderlyHeroCard: {
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
    gap: 6,
  },
  elderlyHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#00B4D8',
  },
  elderlyHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  elderlyCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  elderlyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  elderlyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderlyNameBn: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  elderlyNameEn: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  completedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgePillText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
  },
  elderlyLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  elderlyLogBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#00B4D8',
  },
  elderlyDetailBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  elderlyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  elderlyLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    width: 75,
  },
  elderlyVal: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
    flex: 1,
  },
  elderlyTipBox: {
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    padding: 8,
    borderRadius: 8,
  },
  elderlyTipText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#FCC419',
    lineHeight: 14,
  },
  certificateCard: {
    backgroundColor: '#002B1D',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    gap: 12,
  },
  certHeader: {
    alignItems: 'center',
    gap: 2,
  },
  certGovtTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  certDeptTitle: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  certCardTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFF',
    marginTop: 4,
  },
  certDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },
  certInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
  },
  certInfoCol: {
    width: '45%',
  },
  certInfoLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#A0A0A0',
  },
  certInfoValue: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFF',
  },
  certTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  certTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    padding: 6,
  },
  certTh: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#D4AF37',
  },
  certTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  certTd: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#E0E0E0',
  },
  certFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  sealBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#D4AF37',
  },
  certFooterNote: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#A0A0A0',
    flex: 1,
    lineHeight: 13,
  },
  shareBtn: {
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  shareBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#00344D',
  },
  safetyCard: {
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.2)',
    gap: 6,
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FCC419',
  },
  safetyBody: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 16,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  dialogVacName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#20C997',
  },
  dialogVacSub: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#38BDF8',
  },
  dialogInputGroup: {
    gap: 4,
  },
  dialogInputLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  dialogInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: C.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: F.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dialogCancelText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  dialogConfirmBtn: {
    flex: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#20C997',
  },
  dialogConfirmText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#00344D',
  },
});
