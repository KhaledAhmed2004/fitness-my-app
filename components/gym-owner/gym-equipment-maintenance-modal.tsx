/**
 * Gym Equipment Health & Maintenance AMC Tracker Modal (GymOS)
 * Log machinery service dates, report out-of-order tags, track repair costs & technician contacts.
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
import type { EquipmentCategory, EquipmentStatus, GymEquipmentItem } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymEquipmentMaintenanceModal({ visible, onClose }: Props) {
  const { colors } = useThemeColors();
  const { equipment, addEquipment, updateEquipment, logEquipmentService, deleteEquipment } = useGymOwnerStore();

  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | 'ALL'>('ALL');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedEq, setSelectedEq] = useState<GymEquipmentItem | null>(null);

  // Add Form
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('CARDIO');
  const [technicianPhone, setTechnicianPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Service Log Form
  const [serviceCost, setServiceCost] = useState('3500');
  const [nextDue, setNextDue] = useState('2026-11-30');
  const [serviceNotes, setServiceNotes] = useState('');

  const filteredList = equipment.filter((eq) => {
    if (filterCategory === 'ALL') return true;
    return eq.category === filterCategory;
  });

  const handleSaveEquipment = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please provide an equipment name.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nextQuarter = new Date();
    nextQuarter.setMonth(nextQuarter.getMonth() + 3);

    await addEquipment({
      name: name.trim(),
      brand: brand.trim() || 'Commercial Pro',
      category,
      status: 'OPTIMAL',
      purchaseDate: todayStr,
      lastServiceDate: todayStr,
      nextServiceDueDate: nextQuarter.toISOString().split('T')[0],
      technicianPhone: technicianPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAddModalVisible(false);
  };

  const handleLogService = async () => {
    if (!selectedEq) return;
    const cost = parseFloat(serviceCost) || 0;
    await logEquipmentService(selectedEq.id, nextDue, cost, serviceNotes);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setServiceModalVisible(false);
    setSelectedEq(null);
    Alert.alert('Service Recorded', `${selectedEq.name} status updated to OPTIMAL.`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Equipment Health & AMC Radar</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {equipment.filter((e) => e.status === 'OPTIMAL').length}/{equipment.length} Fully Operational
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setName('');
                setBrand('');
                setTechnicianPhone('');
                setNotes('');
                setAddModalVisible(true);
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add" size={16} color="#000" />
              <Text style={styles.addBtnText}>Add Asset</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORY TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {(
            [
              { key: 'ALL', label: 'All Equipment' },
              { key: 'CARDIO', label: '🏃 Cardio' },
              { key: 'STRENGTH_MACHINE', label: '🦾 Machines' },
              { key: 'FREE_WEIGHTS', label: '🏋️ Free Weights' },
              { key: 'FACILITY_AC', label: '❄️ AC & Facility' },
            ] as const
          ).map((t) => {
            const active = filterCategory === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setFilterCategory(t.key)}
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

        {/* EQUIPMENT LIST */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredList.map((eq) => {
            const isBroken = eq.status === 'OUT_OF_ORDER';
            const isServiceDue = eq.status === 'SERVICE_DUE';

            return (
              <View
                key={eq.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isBroken ? '#FA5252' : isServiceDue ? '#FFB800' : colors.border,
                  },
                ]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eqName, { color: colors.textPrimary }]}>{eq.name}</Text>
                    <Text style={{ fontSize: 11, fontFamily: F.mono, color: colors.textSecondary, marginTop: 2 }}>
                      {eq.brand} • Next AMC: {eq.nextServiceDueDate}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const nextStatus: EquipmentStatus =
                        eq.status === 'OPTIMAL' ? 'SERVICE_DUE' : eq.status === 'SERVICE_DUE' ? 'OUT_OF_ORDER' : 'OPTIMAL';
                      void updateEquipment(eq.id, { status: nextStatus });
                    }}
                    style={[
                      styles.statusBadge,
                      isBroken
                        ? { backgroundColor: '#FFE3E3' }
                        : isServiceDue
                        ? { backgroundColor: '#FFF3BF' }
                        : { backgroundColor: '#E7F3DD' },
                    ]}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: F.monoBold,
                        color: isBroken ? '#FA5252' : isServiceDue ? '#D9480F' : '#0E4D34',
                      }}>
                      {eq.status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {eq.notes ? (
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary, fontStyle: 'italic' }}>
                    "{eq.notes}"
                  </Text>
                ) : null}

                {/* ACTION BAR */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {eq.technicianPhone ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          const cleanPhone = (eq.technicianPhone || '').replace(/[^0-9+]/g, '');
                          Linking.openURL(`tel:${cleanPhone}`).catch(() => {
                            Alert.alert('Call Failed', 'Could not open phone dialer.');
                          });
                        }}
                        style={[styles.smallBtn, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]}>
                        <MaterialIcons name="phone" size={13} color="#38BDF8" />
                        <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: '#38BDF8' }}>
                          Call Tech
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={async () => {
                        const nextQuarter = new Date();
                        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
                        await logEquipmentService(
                          eq.id,
                          nextQuarter.toISOString().split('T')[0],
                          0,
                          'Routine lubrication & bolt tightening'
                        );
                        if (Platform.OS !== 'web') {
                          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        Alert.alert('✅ Quick Service Logged', `${eq.name} lubricated & service date extended by 90 days.`);
                      }}
                      style={[styles.smallBtn, { backgroundColor: colors.glassFill }]}>
                      <MaterialIcons name="clean-hands" size={13} color={colors.textPrimary} />
                      <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.textPrimary }}>
                        Quick Lube
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedEq(eq);
                      setServiceModalVisible(true);
                    }}
                    style={[styles.smallBtn, { backgroundColor: colors.primaryContainer }]}>
                    <MaterialIcons name="build" size={13} color={colors.onPrimaryContainer} />
                    <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.onPrimaryContainer }}>
                      Log AMC
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ----------------- SERVICE LOG MODAL ----------------- */}
        <Modal visible={serviceModalVisible} animationType="fade" transparent onRequestClose={() => setServiceModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Complete Service: {selectedEq?.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                Records repair cost and sets status back to Optimal.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REPAIR / SERVICE COST (BDT)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={serviceCost}
                onChangeText={setServiceCost}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>NEXT SERVICE DUE DATE</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={nextDue}
                onChangeText={setNextDue}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>SERVICE NOTES</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Replaced cable, lubricated belt"
                placeholderTextColor={colors.textMuted}
                value={serviceNotes}
                onChangeText={setServiceNotes}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setServiceModalVisible(false)} style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogService} style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold }}>Save & Mark Optimal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ----------------- ADD ASSET MODAL ----------------- */}
        <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModalVisible(false)}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Gym Machine / Asset</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MACHINE / ASSET NAME *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. LifeFitness Incline Bench"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>BRAND / MODEL</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Hammer Strength Pro Series"
                placeholderTextColor={colors.textMuted}
                value={brand}
                onChangeText={setBrand}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>CATEGORY</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {(['CARDIO', 'STRENGTH_MACHINE', 'FREE_WEIGHTS', 'FACILITY_AC'] as EquipmentCategory[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.sourceSelectPill,
                      category === c
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text style={{ color: category === c ? '#000' : colors.textPrimary, fontSize: 11, fontFamily: F.sansBold }}>
                      {c.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>TECHNICIAN / SERVICE PHONE</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. +880 1715-998877"
                placeholderTextColor={colors.textMuted}
                value={technicianPhone}
                onChangeText={setTechnicianPhone}
              />

              <TouchableOpacity onPress={handleSaveEquipment} style={[styles.saveAssetBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 15 }}>
                  Save Equipment to AMC Radar
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
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eqName: { fontSize: 14, fontFamily: F.sansBold },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontFamily: F.sansBold },
  inputLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5, marginBottom: 4 },
  modalInput: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans },
  sourceSelectPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  saveAssetBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 24 },
  sheetCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
