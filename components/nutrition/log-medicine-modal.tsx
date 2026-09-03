import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Vital } from '@/constants/vital-theme';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  MedicineType,
  MedicineFormFactor,
  MedicineUnit,
  TimeCategory,
} from '@/types/medicine';

const C = Vital.colors;
const F = Vital.fonts;

const FORM_FACTORS_ALL: {
  id: MedicineFormFactor;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}[] = [
  { id: 'pill', icon: 'medication', label: 'Pill' },
  { id: 'capsule', icon: 'medication-liquid', label: 'Capsule' },
  { id: 'syrup', icon: 'water-drop', label: 'Syrup' },
  { id: 'drop', icon: 'opacity', label: 'Drop' },
  { id: 'injection', icon: 'vaccines', label: 'Injection' },
  { id: 'powder', icon: 'blur-on', label: 'Powder' },
  { id: 'gummy', icon: 'catching-pokemon', label: 'Gummy' },
  { id: 'puff', icon: 'air', label: 'Puff' },
  { id: 'application', icon: 'clean-hands', label: 'Cream' },
];

const DEFAULT_SCHEDULE_TIMES: Record<
  TimeCategory,
  { label: string; time: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  morning: { label: 'Morning', time: '08:00 AM', icon: 'wb-sunny' },
  afternoon: { label: 'Afternoon', time: '02:00 PM', icon: 'wb-iridescent' },
  evening: { label: 'Evening', time: '08:00 PM', icon: 'wb-twilight' },
  night: { label: 'Night', time: '10:00 PM', icon: 'nights-stay' },
};

export function LogMedicineModal() {
  const isOpen = useMedicineStore((s) => s.isLogModalOpen);
  const closeLogModal = useMedicineStore((s) => s.closeLogModal);
  const addMedicine = useMedicineStore((s) => s.addMedicine);
  const updateMedicine = useMedicineStore((s) => s.updateMedicine);
  const editingMedicine = useMedicineStore((s) => s.editingMedicine);

  // Form States
  const [name, setName] = useState('');
  const [type, setType] = useState<MedicineType>('medicine');
  const [formFactor, setFormFactor] = useState<MedicineFormFactor>('pill');
  const [strengthStr, setStrengthStr] = useState('');
  const [unit, setUnit] = useState<MedicineUnit>('pill');
  const [instructions, setInstructions] = useState('');

  // Scheduling States
  const [isAsNeeded, setIsAsNeeded] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<TimeCategory[]>([
    'morning',
  ]);
  const [doseAmountStr, setDoseAmountStr] = useState('1');

  // Inventory States
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockStr, setStockStr] = useState('30');
  const [packSizeStr, setPackSizeStr] = useState('30');
  const [lowStockThresholdStr, setLowStockThresholdStr] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingMedicine) {
        setName(editingMedicine.name || '');
        setType(editingMedicine.type || 'medicine');
        setFormFactor(editingMedicine.formFactor || 'pill');
        setStrengthStr(editingMedicine.strength || '');
        setUnit(editingMedicine.unit || 'pill');
        setInstructions(editingMedicine.instructions || '');
        setIsAsNeeded(editingMedicine.isAsNeeded || false);

        if (editingMedicine.schedules && editingMedicine.schedules.length > 0) {
          setSelectedTimes(
            editingMedicine.schedules.map((s) => s.timeCategory)
          );
          setDoseAmountStr(
            (editingMedicine.schedules[0].doseAmount || 1).toString()
          );
        } else {
          setSelectedTimes(['morning']);
          setDoseAmountStr('1');
        }

        setTrackInventory(editingMedicine.trackInventory ?? true);
        setStockStr((editingMedicine.currentStock ?? 30).toString());
        setPackSizeStr((editingMedicine.totalPackSize ?? 30).toString());
        setLowStockThresholdStr(
          (editingMedicine.lowStockThreshold ?? 5).toString()
        );
        setExpiryDate(editingMedicine.expiryDate || '');
      } else {
        setName('');
        setType('medicine');
        setFormFactor('pill');
        setStrengthStr('');
        setUnit('pill');
        setInstructions('');
        setIsAsNeeded(false);
        setSelectedTimes(['morning']);
        setDoseAmountStr('1');
        setTrackInventory(true);
        setStockStr('30');
        setPackSizeStr('30');
        setLowStockThresholdStr('5');
        setExpiryDate('');
      }
    }
  }, [isOpen, editingMedicine]);

  const toggleTimeCategory = (cat: TimeCategory) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedTimes.includes(cat)) {
      if (selectedTimes.length === 1) {
        return;
      }
      setSelectedTimes(selectedTimes.filter((t) => t !== cat));
    } else {
      setSelectedTimes([...selectedTimes, cat]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for the medication.');
      return;
    }

    const doseAmount = Math.max(1, parseFloat(doseAmountStr) || 1);
    const stockCount = Math.max(0, parseInt(stockStr, 10) || 0);
    const packSize = Math.max(stockCount, parseInt(packSizeStr, 10) || 30);
    const threshold = Math.max(1, parseInt(lowStockThresholdStr, 10) || 5);

    const schedules = isAsNeeded
      ? []
      : selectedTimes.map((cat, idx) => ({
          id: editingMedicine?.schedules?.[idx]?.id || `sch-${Date.now()}-${idx}`,
          time: DEFAULT_SCHEDULE_TIMES[cat].time,
          timeCategory: cat,
          doseAmount: doseAmount,
          instructions: instructions.trim() || undefined,
        }));

    if (editingMedicine) {
      updateMedicine(editingMedicine.id, {
        name: name.trim(),
        type,
        formFactor,
        strength: strengthStr.trim() || undefined,
        unit,
        instructions: instructions.trim() || undefined,
        isAsNeeded,
        schedules,
        trackInventory,
        currentStock: stockCount,
        totalPackSize: packSize,
        lowStockThreshold: threshold,
        expiryDate: expiryDate.trim() || undefined,
      });
    } else {
      addMedicine({
        name: name.trim(),
        type,
        formFactor,
        strength: strengthStr.trim() || undefined,
        unit,
        instructions: instructions.trim() || undefined,
        isAsNeeded,
        isCourse: false,
        schedules,
        trackInventory,
        currentStock: stockCount,
        totalPackSize: packSize,
        lowStockThreshold: threshold,
        expiryDate: expiryDate.trim() || undefined,
      });
    }

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    closeLogModal();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeLogModal}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialIcons name="medication" size={22} color={C.primary} />
            <Text style={styles.headerTitle}>
              {editingMedicine ? 'Edit Medication' : 'Add Medication / Supplement'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={closeLogModal}
            hitSlop={12}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: TYPE SELECTOR */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                onPress={() => setType('medicine')}
                activeOpacity={0.75}
                style={[
                  styles.typeOption,
                  type === 'medicine' && styles.typeOptionMedicineActive,
                ]}
              >
                <MaterialIcons
                  name="medical-services"
                  size={18}
                  color={type === 'medicine' ? '#339AF0' : C.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'medicine' && {
                      color: '#339AF0',
                      fontWeight: '700',
                    },
                  ]}
                >
                  Prescription Medicine
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('supplement')}
                activeOpacity={0.75}
                style={[
                  styles.typeOption,
                  type === 'supplement' && styles.typeOptionSupplementActive,
                ]}
              >
                <MaterialIcons
                  name="eco"
                  size={18}
                  color={type === 'supplement' ? '#51CF66' : C.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'supplement' && {
                      color: '#51CF66',
                      fontWeight: '700',
                    },
                  ]}
                >
                  Dietary Supplement
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NAME INPUT */}
          <View style={styles.section}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Vitamin D3, Paracetamol, Metformin"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* FORM FACTOR SELECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>Form Factor</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formFactorList}
            >
              {FORM_FACTORS_ALL.map((f) => {
                const active = formFactor === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      setFormFactor(f.id);
                      if (f.id === 'pill' || f.id === 'capsule') setUnit(f.id);
                      else if (f.id === 'syrup') setUnit('ml');
                      else if (f.id === 'drop') setUnit('drop');
                      else if (f.id === 'powder') setUnit('scoop');
                    }}
                    activeOpacity={0.75}
                    style={[
                      styles.formFactorChip,
                      active && styles.formFactorChipActive,
                    ]}
                  >
                    <MaterialIcons
                      name={f.icon}
                      size={18}
                      color={active ? C.primary : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.formFactorLabel,
                        active && styles.formFactorLabelActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* STRENGTH & UNIT */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Strength / Dose (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500mg or 5000 IU"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={strengthStr}
                onChangeText={setStrengthStr}
              />
            </View>

            <View style={[styles.section, { width: 110 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                placeholder="pill"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                onChangeText={(u) => setUnit(u as MedicineUnit)}
              />
            </View>
          </View>

          {/* INTAKE INSTRUCTIONS */}
          <View style={styles.section}>
            <Text style={styles.label}>Instructions (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Take with meals, Before bedtime"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          {/* STEP 2: DOSING & SCHEDULE */}
          <View style={styles.sectionBox}>
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.sectionBoxTitle}>Dosage & Schedule</Text>
              <View style={styles.prnToggleRow}>
                <Text style={styles.prnText}>As-needed (PRN)</Text>
                <Switch
                  value={isAsNeeded}
                  onValueChange={setIsAsNeeded}
                  trackColor={{ false: C.surfaceContainerHigh, true: C.primary }}
                />
              </View>
            </View>

            {!isAsNeeded ? (
              <View style={{ gap: 12 }}>
                <Text style={styles.subLabel}>
                  Select daily dosage times (choose multiple if needed):
                </Text>
                <View style={styles.timesGrid}>
                  {(
                    Object.keys(
                      DEFAULT_SCHEDULE_TIMES
                    ) as TimeCategory[]
                  ).map((cat) => {
                    const item = DEFAULT_SCHEDULE_TIMES[cat];
                    const active = selectedTimes.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => toggleTimeCategory(cat)}
                        activeOpacity={0.75}
                        style={[
                          styles.timeCard,
                          active && styles.timeCardActive,
                        ]}
                      >
                        <MaterialIcons
                          name={item.icon}
                          size={18}
                          color={active ? C.primary : C.onSurfaceVariant}
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[
                              styles.timeCardLabel,
                              active && styles.timeCardLabelActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.timeCardSub}>{item.time}</Text>
                        </View>
                        {active && (
                          <MaterialIcons
                            name="check-circle"
                            size={16}
                            color={C.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.row, { alignItems: 'center', marginTop: 4 }]}>
                  <Text style={styles.label}>Dose per intake:</Text>
                  <TextInput
                    style={[styles.input, { width: 70, textAlign: 'center' }]}
                    keyboardType="numeric"
                    value={doseAmountStr}
                    onChangeText={setDoseAmountStr}
                  />
                  <Text style={styles.subLabel}>{unit}(s)</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.asNeededNote}>
                This medication will have no fixed alarm. You can log doses
                instantly anytime with the "Take Now" button in your Cabinet.
              </Text>
            )}
          </View>

          {/* STEP 3: INVENTORY TRACKING */}
          <View style={styles.sectionBox}>
            <View style={styles.scheduleHeaderRow}>
              <View>
                <Text style={styles.sectionBoxTitle}>
                  Inventory & Stock Tracking
                </Text>
                <Text style={styles.sectionBoxSub}>
                  Auto-decrement stock on each dose taken
                </Text>
              </View>
              <Switch
                value={trackInventory}
                onValueChange={setTrackInventory}
                trackColor={{ false: C.surfaceContainerHigh, true: C.primary }}
              />
            </View>

            {trackInventory && (
              <View style={{ gap: 12, marginTop: 8 }}>
                <View style={styles.row}>
                  <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.label}>Current Stock Left</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={stockStr}
                      onChangeText={setStockStr}
                      placeholder="30"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    />
                  </View>

                  <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.label}>Total Pack Size</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={packSizeStr}
                      onChangeText={setPackSizeStr}
                      placeholder="30"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.label}>Low-Stock Alert at</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={lowStockThresholdStr}
                      onChangeText={setLowStockThresholdStr}
                      placeholder="5"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    />
                  </View>

                  <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.label}>Expiry Date (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* BOTTOM SAVE BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {editingMedicine ? 'Save Changes' : 'Add to Cabinet'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  section: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
    fontFamily: F.sansMedium,
  },
  subLabel: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
  },
  input: {
    backgroundColor: '#161B1F',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.onSurface,
    fontFamily: F.sansRegular,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#161B1F',
  },
  typeOptionMedicineActive: {
    backgroundColor: 'rgba(51, 154, 240, 0.18)',
  },
  typeOptionSupplementActive: {
    backgroundColor: 'rgba(81, 207, 102, 0.18)',
  },
  typeOptionText: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  formFactorList: {
    gap: 8,
    paddingVertical: 4,
  },
  formFactorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#161B1F',
  },
  formFactorChipActive: {
    backgroundColor: `${C.primary}20`,
  },
  formFactorLabel: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  formFactorLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  sectionBox: {
    backgroundColor: '#161B1F',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  sectionBoxSub: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 2,
  },
  prnToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prnText: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1D2226',
    borderRadius: 14,
    padding: 12,
  },
  timeCardActive: {
    backgroundColor: 'rgba(137, 206, 255, 0.18)',
  },
  timeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  timeCardLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  timeCardSub: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
  },
  asNeededNote: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    lineHeight: 18,
    fontFamily: F.sansRegular,
  },
  footer: {
    padding: 20,
    backgroundColor: C.background,
  },
  saveButton: {
    backgroundColor: '#89CEFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#00344D',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: F.sansBold,
  },
});
