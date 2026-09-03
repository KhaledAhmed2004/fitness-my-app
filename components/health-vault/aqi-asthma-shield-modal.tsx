import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  ASTHMA_EMERGENCY_444_PROTOCOL,
  BANGLADESH_CITIES_AQI,
  DEFAULT_INHALERS_CATALOG,
} from '@/services/aqi-asthma-knowledge';
import {
  calculatePeakFlowZone,
  evaluateDailyAsthmaControl,
  formatAsthmaSummaryReport,
} from '@/services/aqi-asthma-service';
import {
  CityAqiInfo,
  InhalerItem,
  InhalerPuffLog,
  PuffTriggerReason,
} from '@/types/aqi-asthma-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'LIVE_AQI' | 'INHALER_COUNTER' | 'PEAK_FLOW' | 'FIRST_AID_GUIDE';

interface AqiAsthmaShieldModalProps {
  visible: boolean;
  onClose: () => void;
  patientName?: string;
}

export function AqiAsthmaShieldModal({
  visible,
  onClose,
  patientName = 'রোগী',
}: AqiAsthmaShieldModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('LIVE_AQI');
  const [selectedCityId, setSelectedCityId] = useState<string>('dhaka');
  const [inhalers, setInhalers] = useState<InhalerItem[]>(DEFAULT_INHALERS_CATALOG);
  const [puffLogs, setPuffLogs] = useState<InhalerPuffLog[]>([
    {
      id: 'pl1',
      inhalerId: 'inh_bexitrol',
      inhalerName: 'Bexitrol-F Inhaler',
      type: 'CONTROLLER_PREVENTER',
      puffsCount: 1,
      timestamp: '০৮:০০ AM',
      triggerReason: 'ROUTINE_MORNING',
    },
    {
      id: 'pl2',
      inhalerId: 'inh_azmasol',
      inhalerName: 'Azmasol Inhaler',
      type: 'RELIEVER_SOS',
      puffsCount: 2,
      timestamp: '১২:৩০ PM',
      triggerReason: 'POLLUTION_SMOG',
    },
  ]);

  // Peak Flow state
  const [measuredLpmInput, setMeasuredLpmInput] = useState<string>('390');
  const [personalBestLpmInput, setPersonalBestLpmInput] = useState<string>('500');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Selected City Info
  const selectedCity: CityAqiInfo = useMemo(() => {
    return (
      BANGLADESH_CITIES_AQI.find((c) => c.cityId === selectedCityId) ||
      BANGLADESH_CITIES_AQI[0]
    );
  }, [selectedCityId]);

  // Peak Flow Calculation
  const peakFlowResult = useMemo(() => {
    const measured = parseInt(measuredLpmInput, 10) || 350;
    const best = parseInt(personalBestLpmInput, 10) || 500;
    return calculatePeakFlowZone(measured, best);
  }, [measuredLpmInput, personalBestLpmInput]);

  // Control Summary
  const controlSummary = useMemo(() => {
    return evaluateDailyAsthmaControl(selectedCity, puffLogs, peakFlowResult);
  }, [selectedCity, puffLogs, peakFlowResult]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleTakePuff = (
    inhalerId: string,
    puffs: number,
    reason: PuffTriggerReason
  ) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const targetInh = inhalers.find((i) => i.id === inhalerId);
    if (!targetInh) return;

    if (targetInh.remainingPuffs < puffs) {
      Alert.alert(
        'ইনহেলার শেষ!',
        `${targetInh.brandName} এ পর্যাপ্ত পাফ অবশিষ্ট নেই। নতুন ইনহেলার নিন।`
      );
      return;
    }

    // Decrement puff
    setInhalers((prev) =>
      prev.map((i) =>
        i.id === inhalerId
          ? {
              ...i,
              remainingPuffs: Math.max(0, i.remainingPuffs - puffs),
              lastPuffTimestamp: new Date().toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : i
      )
    );

    const newLog: InhalerPuffLog = {
      id: `puff_${Date.now()}`,
      inhalerId: targetInh.id,
      inhalerName: targetInh.brandName,
      type: targetInh.type,
      puffsCount: puffs,
      timestamp: new Date().toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      triggerReason: reason,
    };

    setPuffLogs((prev) => [newLog, ...prev]);
    showToast(`+${puffs} পাফ ${targetInh.brandName} গ্রহণ করা হয়েছে 💨`);
  };

  const handleResetInhaler = (inhalerId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setInhalers((prev) =>
      prev.map((i) =>
        i.id === inhalerId ? { ...i, remainingPuffs: i.totalPuffsCapacity } : i
      )
    );
    showToast('ইনহেলার নতুন ক্যানিস্টারে রিসেট করা হয়েছে! 🔄');
  };

  const handleDeletePuffLog = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setPuffLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleCopyReport = async () => {
    const text = formatAsthmaSummaryReport(controlSummary, puffLogs, patientName);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('অ্যাজমা ও AQI রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatAsthmaSummaryReport(controlSummary, puffLogs, patientName);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="air" size={24} color="#38BDF8" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Live AQI & Asthma Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  বায়ু দূষণ ও অ্যাজমা ইনহেলার শিল্ড
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
              }}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('LIVE_AQI')}
              style={[styles.tabBtn, activeTab === 'LIVE_AQI' && styles.tabBtnActive]}>
              <MaterialIcons
                name="cloud-queue"
                size={16}
                color={activeTab === 'LIVE_AQI' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'LIVE_AQI' && styles.tabBtnTextActive,
                ]}>
                🌫️ লাইভ AQI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('INHALER_COUNTER')}
              style={[styles.tabBtn, activeTab === 'INHALER_COUNTER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="medical-services"
                size={16}
                color={activeTab === 'INHALER_COUNTER' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'INHALER_COUNTER' && styles.tabBtnTextActive,
                ]}>
                💨 ইনহেলার কাউন্টার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PEAK_FLOW')}
              style={[styles.tabBtn, activeTab === 'PEAK_FLOW' && styles.tabBtnActive]}>
              <MaterialIcons
                name="speed"
                size={16}
                color={activeTab === 'PEAK_FLOW' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PEAK_FLOW' && styles.tabBtnTextActive,
                ]}>
                📊 পিক ফ্লো ({peakFlowResult.percentOfPersonalBest}%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FIRST_AID_GUIDE')}
              style={[styles.tabBtn, activeTab === 'FIRST_AID_GUIDE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="healing"
                size={16}
                color={activeTab === 'FIRST_AID_GUIDE' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FIRST_AID_GUIDE' && styles.tabBtnTextActive,
                ]}>
                🛡️ ফার্স্ট এইড
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: LIVE CITY AQI & HEALTH ADVICE */}
            {/* ========================================================================= */}
            {activeTab === 'LIVE_AQI' && (
              <>
                {/* City Picker Carousel */}
                <View style={styles.cityPickerCard}>
                  <Text style={styles.cityPickerLabel}>আপনার শহর নির্বাচন করুন:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cityPillsScroll}>
                    {BANGLADESH_CITIES_AQI.map((city) => {
                      const isSelected = selectedCityId === city.cityId;
                      return (
                        <TouchableOpacity
                          key={city.cityId}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setSelectedCityId(city.cityId);
                          }}
                          style={[
                            styles.cityPill,
                            isSelected && styles.cityPillActive,
                          ]}>
                          <Text
                            style={[
                              styles.cityPillText,
                              isSelected && styles.cityPillTextActive,
                            ]}>
                            {city.cityNameBn}
                          </Text>
                          <Text
                            style={[
                              styles.cityPillAqi,
                              { color: city.categoryColor },
                            ]}>
                            AQI {city.currentAqi}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* AQI Meter Hero Banner */}
                <View
                  style={[
                    styles.aqiHeroCard,
                    { borderColor: `${selectedCity.categoryColor}60` },
                  ]}>
                  <View style={styles.aqiHeroTop}>
                    <View>
                      <Text style={styles.aqiCityTitle}>
                        {selectedCity.cityNameBn} এর বর্তমান বায়ুমান
                      </Text>
                      <Text style={styles.aqiCategoryBadge}>
                        {selectedCity.categoryLabelBn}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.aqiCircle,
                        { backgroundColor: selectedCity.categoryColor },
                      ]}>
                      <Text style={styles.aqiCircleNum}>
                        {selectedCity.currentAqi}
                      </Text>
                      <Text style={styles.aqiCircleLbl}>AQI</Text>
                    </View>
                  </View>

                  <View style={styles.pmRow}>
                    <Text style={styles.pmText}>
                      সূক্ষ্ম ধূলিকণা PM2.5: {selectedCity.pm25Concentration} µg/m³
                    </Text>
                  </View>

                  <Text style={styles.aqiAdvisory}>{selectedCity.advisoryBn}</Text>

                  {/* Quick Safety Badges */}
                  <View style={styles.safetyBadgesRow}>
                    <View
                      style={[
                        styles.safetyBadge,
                        selectedCity.maskRequired
                          ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                          : { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      ]}>
                      <MaterialIcons
                        name="masks"
                        size={14}
                        color={selectedCity.maskRequired ? '#EF4444' : '#10B981'}
                      />
                      <Text
                        style={[
                          styles.safetyBadgeText,
                          {
                            color: selectedCity.maskRequired
                              ? '#EF4444'
                              : '#10B981',
                          },
                        ]}>
                        {selectedCity.maskRequired
                          ? 'N95 মাস্ক পরিধান আবশ্যক'
                          : 'মাস্ক ঐচ্ছিক'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.safetyBadge,
                        !selectedCity.outdoorSafe
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.15)' }
                          : { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      ]}>
                      <MaterialIcons
                        name="directions-run"
                        size={14}
                        color={!selectedCity.outdoorSafe ? '#F59E0B' : '#10B981'}
                      />
                      <Text
                        style={[
                          styles.safetyBadgeText,
                          {
                            color: !selectedCity.outdoorSafe
                              ? '#F59E0B'
                              : '#10B981',
                          },
                        ]}>
                        {!selectedCity.outdoorSafe
                          ? 'আউটডোর ব্যায়াম নিষেধ'
                          : 'স্বাভাবিক চলাচল নিরাপদ'}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: INHALER DOSE & PUFF COUNTER */}
            {/* ========================================================================= */}
            {activeTab === 'INHALER_COUNTER' && (
              <>
                <Text style={styles.sectionTitle}>
                  আপনার সংরক্ষিত ইনহেলার ও অবশিষ্ট ডোজ:
                </Text>

                {inhalers.map((inh) => {
                  const percentLeft = Math.round(
                    (inh.remainingPuffs / inh.totalPuffsCapacity) * 100
                  );
                  const isLow = inh.remainingPuffs <= inh.lowPuffAlertThreshold;
                  return (
                    <View key={inh.id} style={styles.inhalerCard}>
                      <View style={styles.inhalerCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inhalerName}>{inh.brandName}</Text>
                          <Text style={styles.inhalerGeneric}>
                            {inh.genericName} •{' '}
                            {inh.type === 'RELIEVER_SOS'
                              ? '🔴 রিলিভার (জরুরি)'
                              : '🔵 প্রিভেন্টার (নিয়মিত)'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.puffRemainingBadge,
                            isLow && styles.puffRemainingBadgeLow,
                          ]}>
                          <Text
                            style={[
                              styles.puffRemainingNum,
                              isLow && { color: '#EF4444' },
                            ]}>
                            {inh.remainingPuffs}
                          </Text>
                          <Text style={styles.puffRemainingLbl}>পাফ বাকি</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.puffProgressBarTrack}>
                        <View
                          style={[
                            styles.puffProgressBarFill,
                            {
                              width: `${percentLeft}%`,
                              backgroundColor: isLow ? '#EF4444' : inh.colorTag,
                            },
                          ]}
                        />
                      </View>

                      {isLow && (
                        <View style={styles.lowPuffAlertRow}>
                          <MaterialIcons name="notification-important" size={14} color="#EF4444" />
                          <Text style={styles.lowPuffAlertText}>
                            সতর্কতা: মাত্র {inh.remainingPuffs}টি পাফ বাকি। নতুন ইনহেলার সংগ্রহ করুন।
                          </Text>
                        </View>
                      )}

                      {/* Quick Take Puff Actions */}
                      <View style={styles.inhalerActionsRow}>
                        <TouchableOpacity
                          onPress={() =>
                            handleTakePuff(
                              inh.id,
                              1,
                              inh.type === 'RELIEVER_SOS'
                                ? 'ACUTE_BREATHLESSNESS'
                                : 'ROUTINE_MORNING'
                            )
                          }
                          style={styles.takePuffBtn}>
                          <MaterialIcons name="air" size={14} color="#FFFFFF" />
                          <Text style={styles.takePuffBtnText}>+১ পাফ গ্রহণ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleTakePuff(
                              inh.id,
                              2,
                              inh.type === 'RELIEVER_SOS'
                                ? 'ACUTE_BREATHLESSNESS'
                                : 'ROUTINE_NIGHT'
                            )
                          }
                          style={styles.takePuffBtn}>
                          <MaterialIcons name="air" size={14} color="#FFFFFF" />
                          <Text style={styles.takePuffBtnText}>+২ পাফ গ্রহণ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleResetInhaler(inh.id)}
                          style={styles.resetCanisterBtn}>
                          <MaterialIcons name="refresh" size={14} color={C.onSurfaceVariant} />
                          <Text style={styles.resetCanisterText}>নতুন পাতা</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Today's Puff Log History */}
                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>
                    আজকের পাফ গ্রহণের হিস্ট্রি ({puffLogs.length}টি):
                  </Text>
                  {puffLogs.map((log) => (
                    <View key={log.id} style={styles.historyItem}>
                      <MaterialIcons name="air" size={16} color="#38BDF8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>
                          {log.inhalerName} ({log.puffsCount} পাফ)
                        </Text>
                        <Text style={styles.historyTime}>
                          {log.timestamp} • {log.triggerReason}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeletePuffLog(log.id)}
                        style={styles.deleteBtn}>
                        <MaterialIcons name="close" size={14} color={C.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: PEAK FLOW METER & ZONES */}
            {/* ========================================================================= */}
            {activeTab === 'PEAK_FLOW' && (
              <>
                <View style={styles.peakFlowInputCard}>
                  <Text style={styles.cardHeaderTitle}>
                    পিক ফ্লো মিটার (Peak Expiratory Flow Rate - PEFR):
                  </Text>

                  <View style={styles.peakInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputColLabel}>
                        আজকের পরিমাপ (L/min)
                      </Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={measuredLpmInput}
                        onChangeText={setMeasuredLpmInput}
                        placeholder="e.g. 390"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputColLabel}>
                        ব্যক্তিগত সর্বোচ্চ বেস্ট (L/min)
                      </Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={personalBestLpmInput}
                        onChangeText={setPersonalBestLpmInput}
                        placeholder="e.g. 500"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>
                </View>

                {/* Zone Traffic-Light Hero */}
                <View
                  style={[
                    styles.zoneHeroCard,
                    { borderColor: `${peakFlowResult.zoneColor}60` },
                  ]}>
                  <View style={styles.zoneHeroTop}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.zoneHeroTitle,
                          { color: peakFlowResult.zoneColor },
                        ]}>
                        {peakFlowResult.zoneLabelBn}
                      </Text>
                      <Text style={styles.zoneHeroSub}>
                        ব্যক্তিগত সর্বোচ্চ বেস্টের{' '}
                        {peakFlowResult.percentOfPersonalBest}% ক্ষমতা
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.zoneCircle,
                        { backgroundColor: peakFlowResult.zoneColor },
                      ]}>
                      <Text style={styles.zoneCircleNum}>
                        {peakFlowResult.percentOfPersonalBest}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.zoneClinicalAdvice}>
                    {peakFlowResult.clinicalActionBn}
                  </Text>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: FIRST AID 4-4-4 & SPACER GUIDE */}
            {/* ========================================================================= */}
            {activeTab === 'FIRST_AID_GUIDE' && (
              <>
                <View style={styles.protocolHeroCard}>
                  <MaterialIcons name="emergency" size={24} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.protocolHeroTitle}>
                      তীব্র শ্বাসকষ্টে ৪-৪-৪ জরুরি ফার্স্ট এইড প্রটোকল
                    </Text>
                    <Text style={styles.protocolHeroSub}>
                      হঠাৎ হাঁপানির টান বাড়লে আতঙ্কিত না হয়ে নিচের ৪টি ধাপ অনুসরণ করুন:
                    </Text>
                  </View>
                </View>

                {ASTHMA_EMERGENCY_444_PROTOCOL.map((step) => (
                  <View key={step.step} style={styles.stepCard}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>{step.step}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>{step.titleBn}</Text>
                      <Text style={styles.stepBody}>{step.instructionBn}</Text>
                    </View>
                  </View>
                ))}

                {/* DOCTOR SUMMARY SHARE ACTIONS */}
                <View style={styles.shareActionSection}>
                  <Text style={styles.sectionTitle}>
                    বক্ষব্যাধি বিশেষজ্ঞ বা চিকিৎসকের জন্য রিপোর্ট:
                  </Text>
                  <View style={styles.shareActionRow}>
                    <TouchableOpacity
                      onPress={handleCopyReport}
                      style={styles.copySummaryBtn}>
                      <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                      <Text style={styles.copySummaryBtnText}>রিপোর্ট কপি করুন</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleWhatsAppShare}
                      style={styles.waSummaryBtn}>
                      <MaterialIcons name="share" size={16} color="#25D366" />
                      <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
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
  sheetContainer: {
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
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
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
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#38BDF8',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  toastWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  cityPickerCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  cityPickerLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  cityPillsScroll: {
    gap: 6,
  },
  cityPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cityPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  cityPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  cityPillTextActive: {
    color: '#38BDF8',
  },
  cityPillAqi: {
    fontFamily: F.bold,
    fontSize: 9,
    marginTop: 2,
  },
  aqiHeroCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  aqiHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aqiCityTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  aqiCategoryBadge: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  aqiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiCircleNum: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  aqiCircleLbl: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  pmRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pmText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  aqiAdvisory: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  safetyBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  safetyBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  inhalerCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  inhalerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  inhalerName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  inhalerGeneric: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  puffRemainingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  puffRemainingBadgeLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  puffRemainingNum: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#38BDF8',
  },
  puffRemainingLbl: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  puffProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  puffProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lowPuffAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 6,
    borderRadius: 6,
  },
  lowPuffAlertText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#EF4444',
  },
  inhalerActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  takePuffBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    borderRadius: 8,
  },
  takePuffBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  resetCanisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetCanisterText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  historySection: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceContainer,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  historyTime: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  deleteBtn: {
    padding: 4,
  },
  peakFlowInputCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  cardHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  peakInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputColLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  textInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  zoneHeroCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  zoneHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
  },
  zoneHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  zoneCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneCircleNum: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  zoneClinicalAdvice: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  protocolHeroCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  protocolHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  protocolHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  stepCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  stepTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  stepBody: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  shareActionSection: {
    gap: 8,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copySummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  copySummaryBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  waSummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  waSummaryBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
});
