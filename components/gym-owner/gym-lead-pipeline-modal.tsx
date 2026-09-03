/**
 * Gym Lead Pipeline & Walk-in Inquiries CRM (GymOS)
 * Track Walk-in trials, Instagram inquiries, follow-up dates & 1-tap conversion to active paid member.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymLeadItem, LeadSource, LeadStatus, MembershipPlanType, PaymentMethod } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymLeadPipelineModal({ visible, onClose }: Props) {
  const { colors } = useThemeColors();
  const { leads, addLead, updateLead, deleteLead, convertLeadToMember, generateWhatsAppTrialPass } = useGymOwnerStore();

  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<GymLeadItem | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('WALK_IN');
  const [plan, setPlan] = useState<MembershipPlanType>('QUARTERLY_PRO');
  const [trialDate, setTrialDate] = useState('');
  const [notes, setNotes] = useState('');

  // Conversion Form
  const [convertPaid, setConvertPaid] = useState('12000');
  const [convertFee, setConvertFee] = useState('12000');
  const [convertMethod, setConvertMethod] = useState<PaymentMethod>('bKash');

  const filteredLeads = leads.filter((l) => {
    if (filterStatus === 'ALL') return true;
    return l.status === filterStatus;
  });

  const handleSaveLead = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please provide a name and contact phone number.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 2);

    await addLead({
      fullName: fullName.trim(),
      phone: phone.trim(),
      source,
      status: trialDate ? 'TRIAL_BOOKED' : 'INQUIRY',
      interestedPlan: plan,
      trialDate: trialDate.trim() || undefined,
      followUpDate: followUp.toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAddModalVisible(false);
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    const fee = parseFloat(convertFee) || 12000;
    const paid = parseFloat(convertPaid) || 0;

    await convertLeadToMember(
      selectedLead.id,
      selectedLead.interestedPlan,
      '3-Month Converted Member Pass',
      fee,
      paid,
      convertMethod
    );

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setConvertModalVisible(false);
    setSelectedLead(null);
    Alert.alert('Success', `${selectedLead.fullName} has been converted into an Active Gym Member!`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Walk-in & Trial Leads CRM</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {leads.filter((l) => l.status === 'CONVERTED').length} Converted • {leads.length} Total Leads
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setFullName('');
                setPhone('');
                setTrialDate('');
                setNotes('');
                setAddModalVisible(true);
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="person-add-alt-1" size={16} color="#000" />
              <Text style={styles.addBtnText}>New Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATUS TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {(
            [
              { key: 'ALL', label: 'All Leads' },
              { key: 'INQUIRY', label: '💬 Inquiries' },
              { key: 'TRIAL_BOOKED', label: '🏋️ Trial Booked' },
              { key: 'CONVERTED', label: '✅ Converted' },
              { key: 'LOST', label: '❌ Lost' },
            ] as const
          ).map((t) => {
            const active = filterStatus === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setFilterStatus(t.key)}
                style={[
                  styles.tabPill,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Text style={{ color: active ? '#000' : colors.textSecondary, fontSize: 11, fontFamily: F.sansBold }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* LEADS LIST */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredLeads.map((lead) => {
            const isConverted = lead.status === 'CONVERTED';
            return (
              <View key={lead.id} style={[styles.leadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.leadHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.leadName, { color: colors.textPrimary }]}>{lead.fullName}</Text>
                      <View style={[styles.sourceBadge, { backgroundColor: colors.glassFill }]}>
                        <Text style={{ fontSize: 9, fontFamily: F.mono, color: colors.textSecondary }}>{lead.source}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, fontFamily: F.sans, color: colors.textSecondary, marginTop: 2 }}>
                      {lead.phone} • Inquiry: {lead.inquiryDate}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      lead.status === 'CONVERTED'
                        ? { backgroundColor: '#E7F3DD' }
                        : lead.status === 'TRIAL_BOOKED'
                        ? { backgroundColor: '#FFF3BF' }
                        : { backgroundColor: colors.glassFill },
                    ]}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: F.monoBold,
                        color: lead.status === 'CONVERTED' ? '#0E4D34' : lead.status === 'TRIAL_BOOKED' ? '#D9480F' : colors.textPrimary,
                      }}>
                      {lead.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {lead.trialDate ? (
                  <View style={[styles.trialBanner, { backgroundColor: C.primaryAlpha20 }]}>
                    <MaterialIcons name="event" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.primary }}>
                      Trial Session: {lead.trialDate}
                    </Text>
                  </View>
                ) : null}

                {lead.notes ? (
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary, fontStyle: 'italic' }}>
                    "{lead.notes}"
                  </Text>
                ) : null}

                {/* ACTION BAR */}
                {!isConverted ? (
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const msg = generateWhatsAppTrialPass(lead);
                        const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
                        Linking.openURL(url).catch(() => {
                          Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
                        });
                      }}
                      style={[styles.smallBtn, { backgroundColor: '#25D366' }]}>
                      <MaterialIcons name="confirmation-number" size={13} color="#FFF" />
                      <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: '#FFF' }}>
                        Send VIP Pass
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => updateLead(lead.id, { status: lead.status === 'INQUIRY' ? 'TRIAL_BOOKED' : 'INQUIRY' })}
                      style={[styles.smallBtn, { backgroundColor: colors.glassFill }]}>
                      <MaterialIcons name="fitness-center" size={13} color={colors.textPrimary} />
                      <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.textPrimary }}>
                        {lead.status === 'INQUIRY' ? 'Book Trial' : 'Set Inquiry'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedLead(lead);
                        setConvertModalVisible(true);
                      }}
                      style={[styles.smallBtn, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="how-to-reg" size={13} color="#000" />
                      <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: '#000' }}>
                        Convert
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {/* ----------------- CONVERT MODAL ----------------- */}
        <Modal visible={convertModalVisible} animationType="fade" transparent onRequestClose={() => setConvertModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Convert Lead: {selectedLead?.fullName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                Phone: {selectedLead?.phone}
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TOTAL PACKAGE FEE (BDT)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={convertFee}
                onChangeText={setConvertFee}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>COLLECTED UPFRONT (BDT)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={convertPaid}
                onChangeText={setConvertPaid}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setConvertModalVisible(false)} style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleConvert} style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold }}>Enroll Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ----------------- ADD LEAD MODAL ----------------- */}
        <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModalVisible(false)}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Walk-in / Inquiry</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Shakil Mahmud"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>PHONE NUMBER *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. +880 1711-334455"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>LEAD SOURCE</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {(['WALK_IN', 'INSTAGRAM', 'FACEBOOK', 'MEMBER_REFERRAL'] as LeadSource[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSource(s)}
                    style={[
                      styles.sourceSelectPill,
                      source === s
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text style={{ color: source === s ? '#000' : colors.textPrimary, fontSize: 11, fontFamily: F.sansBold }}>
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>TRIAL TIME / DATE (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Tomorrow 6:00 PM"
                placeholderTextColor={colors.textMuted}
                value={trialDate}
                onChangeText={setTrialDate}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>NOTES</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Interested in fat loss + female trainer"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                onPress={handleSaveLead}
                style={[styles.saveLeadBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 15 }}>
                  Save Lead to Pipeline
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontFamily: F.sansBold },
  subtitle: { fontSize: 12, fontFamily: F.sans, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addBtnText: { color: '#000', fontFamily: F.sansBold, fontSize: 12 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tabRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1 },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  leadCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  leadHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  leadName: { fontSize: 14, fontFamily: F.sansBold },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTopWidth: 1 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontFamily: F.sansBold },
  inputLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5, marginBottom: 4 },
  modalInput: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans },
  sourceSelectPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  saveLeadBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 24 },
  sheetCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
