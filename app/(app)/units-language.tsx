import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useLanguageStore } from '@/stores/language-store';
import { LanguageCode } from '@/types/language';

const C = Vital.colors;
const F = Vital.fonts;

// Available Options Dataset
const WEIGHT_OPTIONS = [
  { id: 'kg', label: 'Kilograms (kg)', desc: 'Standard metric unit for body mass' },
  { id: 'lbs', label: 'Pounds (lbs)', desc: 'Imperial unit used across US & UK' },
  { id: 'st', label: 'Stones & Pounds (st)', desc: 'Traditional British body weight measure' },
];

const DISTANCE_OPTIONS = [
  { id: 'km', label: 'Centimeters & Kilometers (cm, km)', desc: 'Metric standard for running & height' },
  { id: 'mi', label: 'Feet & Miles (ft, mi)', desc: 'Imperial standard for distance & pacing' },
];

const WATER_OPTIONS = [
  { id: 'ml', label: 'Milliliters & Liters (ml, L)', desc: 'Metric volume standard' },
  { id: 'floz', label: 'Fluid Ounces (fl oz)', desc: 'Imperial liquid measure' },
];

const ENERGY_OPTIONS = [
  { id: 'kcal', label: 'Calories (kcal)', desc: 'Dietary calories & workout energy burn' },
  { id: 'kj', label: 'Kilojoules (kJ)', desc: 'Scientific SI energy unit' },
];

const TEMP_OPTIONS = [
  { id: 'celsius', label: 'Celsius (°C)', desc: 'Standard temperature scale' },
  { id: 'fahrenheit', label: 'Fahrenheit (°F)', desc: 'US customary temperature scale' },
];

const LANGUAGES = [
  { id: 'en', flag: '🇬🇧', label: 'English (US)', region: 'International Standard' },
  { id: 'bn', flag: '🇧🇩', label: 'বাংলা (Bengali)', region: 'বাংলাদেশ ও আন্তর্জাতিক' },
  { id: 'es', flag: '🇪🇸', label: 'Español', region: 'España y Latinoamérica' },
  { id: 'de', flag: '🇩🇪', label: 'Deutsch', region: 'Deutschland & Österreich' },
  { id: 'fr', flag: '🇫🇷', label: 'Français', region: 'France & Francophonie' },
  { id: 'ja', flag: '🇯🇵', label: '日本語 (Japanese)', region: '日本' },
];

const TIME_FORMATS = [
  { id: '12h', label: '12-Hour Clock (2:30 PM)', desc: 'Standard AM/PM format' },
  { id: '24h', label: '24-Hour Clock (14:30)', desc: 'Military & international standard' },
];

const WEEK_START_OPTIONS = [
  { id: 'monday', label: 'Monday', desc: 'ISO 8601 international workweek start' },
  { id: 'sunday', label: 'Sunday', desc: 'US & traditional calendar start' },
  { id: 'saturday', label: 'Saturday', desc: 'Middle East weekend structure' },
];

const CURRENCY_OPTIONS = [
  { id: 'USD', symbol: '$', label: 'US Dollar ($)', desc: 'United States Dollar' },
  { id: 'BDT', symbol: '৳', label: 'Bangladeshi Taka (৳)', desc: 'বাংলাদেশী টাকা' },
  { id: 'EUR', symbol: '€', label: 'Euro (€)', desc: 'European Union' },
  { id: 'GBP', symbol: '£', label: 'British Pound (£)', desc: 'United Kingdom' },
  { id: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)', desc: 'Canada' },
  { id: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)', desc: '日本円' },
  { id: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)', desc: 'Australia' },
];

export default function UnitsLanguageScreen() {
  // Preset state: 'metric' | 'imperial' | 'custom'
  const [activePreset, setActivePreset] = useState<'metric' | 'imperial' | 'custom'>('metric');

  // Granular unit choices
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs' | 'st'>('kg');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [waterUnit, setWaterUnit] = useState<'ml' | 'floz'>('ml');
  const [energyUnit, setEnergyUnit] = useState<'kcal' | 'kj'>('kcal');
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');

  // Language & Regional
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [weekStart, setWeekStart] = useState<'monday' | 'sunday' | 'saturday'>('monday');
  const [currency, setCurrency] = useState('USD');

  // Picker Modal State
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    icon: any;
    iconColor: string;
    options: { id: string; label: string; desc?: string; symbol?: string }[];
    selectedValue: string;
    onSelect: (id: string) => void;
  }>({
    visible: false,
    title: '',
    icon: 'tune',
    iconColor: '#89CEFF',
    options: [],
    selectedValue: '',
    onSelect: () => {},
  });

  // Reset confirmation modal & Toast
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyPreset = (preset: 'metric' | 'imperial') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setActivePreset(preset);
    if (preset === 'metric') {
      setWeightUnit('kg');
      setDistanceUnit('km');
      setWaterUnit('ml');
      setEnergyUnit('kcal');
      setTempUnit('celsius');
      triggerToast('Applied Metric (SI) Unit System.');
    } else {
      setWeightUnit('lbs');
      setDistanceUnit('mi');
      setWaterUnit('floz');
      setEnergyUnit('kcal');
      setTempUnit('fahrenheit');
      triggerToast('Applied Imperial (US/UK) Unit System.');
    }
  };

  const openPicker = (
    title: string,
    icon: any,
    iconColor: string,
    options: { id: string; label: string; desc?: string; symbol?: string }[],
    selectedValue: string,
    onSelect: (id: string) => void
  ) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setPickerModal({
      visible: true,
      title,
      icon,
      iconColor,
      options,
      selectedValue,
      onSelect: (val) => {
        setActivePreset('custom');
        onSelect(val);
        setPickerModal((prev) => ({ ...prev, visible: false }));
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      },
    });
  };

  const handleResetDefaults = () => {
    setActivePreset('metric');
    setWeightUnit('kg');
    setDistanceUnit('km');
    setWaterUnit('ml');
    setEnergyUnit('kcal');
    setTempUnit('celsius');
    setSelectedLanguage('en');
    setTimeFormat('12h');
    setWeekStart('monday');
    setCurrency('USD');

    setResetModalVisible(false);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    triggerToast('All units & language preferences reset to default.');
  };

  // Helper labels
  const getWeightLabel = () => WEIGHT_OPTIONS.find((o) => o.id === weightUnit)?.label ?? 'Kilograms (kg)';
  const getDistanceLabel = () => (distanceUnit === 'km' ? 'Kilometers (km)' : 'Miles (mi)');
  const getWaterLabel = () => (waterUnit === 'ml' ? 'Milliliters (ml)' : 'Fluid Ounces (fl oz)');
  const getEnergyLabel = () => (energyUnit === 'kcal' ? 'Calories (kcal)' : 'Kilojoules (kJ)');
  const getTempLabel = () => (tempUnit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)');
  const getCurrencyLabel = () => CURRENCY_OPTIONS.find((c) => c.id === currency)?.label ?? 'US Dollar ($)';
  const getWeekStartLabel = () => WEEK_START_OPTIONS.find((w) => w.id === weekStart)?.label ?? 'Monday';

  // Live Conversion Sample Values
  const sampleWeight =
    weightUnit === 'kg' ? '74.5 kg' : weightUnit === 'lbs' ? '164.2 lbs' : '11 st 10 lbs';
  const sampleDistance = distanceUnit === 'km' ? '5.20 km' : '3.23 mi';
  const sampleWater = waterUnit === 'ml' ? '2,400 ml' : '81.2 fl oz';
  const sampleEnergy = energyUnit === 'kcal' ? '2,150 kcal' : '8,995 kJ';

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

        <Text style={styles.appBarTitle}>Units & Language</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setResetModalVisible(true)}
          style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* TOAST FEEDBACK */}
        {toastMessage ? (
          <View style={styles.toastCard}>
            <MaterialIcons name="check-circle" size={18} color="#89FE00" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        ) : null}

        {/* LIVE CONVERSION PREVIEW CARD */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIconWrap}>
              <MaterialIcons name="calculate" size={20} color="#89CEFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>Live Conversion Preview</Text>
              <Text style={styles.previewSubtitle}>Calculations reflect your selected units</Text>
            </View>
          </View>

          <View style={styles.previewGrid}>
            <View style={styles.previewTile}>
              <Text style={styles.previewTileLabel}>BODY WEIGHT</Text>
              <Text style={styles.previewTileValue}>{sampleWeight}</Text>
            </View>
            <View style={styles.previewTile}>
              <Text style={styles.previewTileLabel}>DISTANCE</Text>
              <Text style={styles.previewTileValue}>{sampleDistance}</Text>
            </View>
            <View style={styles.previewTile}>
              <Text style={styles.previewTileLabel}>HYDRATION</Text>
              <Text style={styles.previewTileValue}>{sampleWater}</Text>
            </View>
            <View style={styles.previewTile}>
              <Text style={styles.previewTileLabel}>ENERGY</Text>
              <Text style={styles.previewTileValue}>{sampleEnergy}</Text>
            </View>
          </View>
        </View>

        {/* GLOBAL UNIT SYSTEM PRESET SELECTOR */}
        <Text style={styles.sectionHeader}>GLOBAL UNIT PRESET</Text>
        <View style={styles.presetContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleApplyPreset('metric')}
            style={[
              styles.presetBtn,
              activePreset === 'metric' && styles.presetBtnActive,
            ]}>
            <MaterialIcons
              name="public"
              size={18}
              color={activePreset === 'metric' ? '#002538' : '#89CEFF'}
            />
            <View>
              <Text
                style={[
                  styles.presetBtnTitle,
                  activePreset === 'metric' && styles.presetBtnTitleActive,
                ]}>
                Metric (SI)
              </Text>
              <Text
                style={[
                  styles.presetBtnSub,
                  activePreset === 'metric' && styles.presetBtnSubActive,
                ]}>
                kg, km, ml, °C
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleApplyPreset('imperial')}
            style={[
              styles.presetBtn,
              activePreset === 'imperial' && styles.presetBtnActive,
            ]}>
            <MaterialIcons
              name="flag"
              size={18}
              color={activePreset === 'imperial' ? '#002538' : '#89CEFF'}
            />
            <View>
              <Text
                style={[
                  styles.presetBtnTitle,
                  activePreset === 'imperial' && styles.presetBtnTitleActive,
                ]}>
                Imperial (US)
              </Text>
              <Text
                style={[
                  styles.presetBtnSub,
                  activePreset === 'imperial' && styles.presetBtnSubActive,
                ]}>
                lbs, mi, fl oz, °F
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* GRANULAR UNIT SELECTION */}
        <Text style={styles.sectionHeader}>MEASUREMENT UNITS</Text>
        <View style={styles.cardGroup}>
          {/* BODY WEIGHT */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Body Weight Unit',
                'fitness-center',
                '#38BDF8',
                WEIGHT_OPTIONS,
                weightUnit,
                (v) => setWeightUnit(v as any)
              )
            }
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialIcons name="fitness-center" size={18} color="#38BDF8" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Body Weight</Text>
              <Text style={styles.rowSubtitle}>{getWeightLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* HEIGHT & DISTANCE */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Distance & Height',
                'straighten',
                '#51CF66',
                DISTANCE_OPTIONS,
                distanceUnit,
                (v) => setDistanceUnit(v as any)
              )
            }
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(81, 207, 102, 0.15)' }]}>
              <MaterialIcons name="straighten" size={18} color="#51CF66" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Height & Running Distance</Text>
              <Text style={styles.rowSubtitle}>{getDistanceLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* WATER & LIQUIDS */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Liquid & Hydration Volume',
                'water-drop',
                '#89CEFF',
                WATER_OPTIONS,
                waterUnit,
                (v) => setWaterUnit(v as any)
              )
            }
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(137, 206, 255, 0.15)' }]}>
              <MaterialIcons name="water-drop" size={18} color="#89CEFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Water & Hydration Volume</Text>
              <Text style={styles.rowSubtitle}>{getWaterLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* ENERGY BURN */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Energy & Metabolism',
                'bolt',
                '#FCC419',
                ENERGY_OPTIONS,
                energyUnit,
                (v) => setEnergyUnit(v as any)
              )
            }
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
              <MaterialIcons name="bolt" size={18} color="#FCC419" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Energy & Metabolic Burn</Text>
              <Text style={styles.rowSubtitle}>{getEnergyLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* TEMPERATURE */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Body & Weather Temperature',
                'thermostat',
                '#FF6B6B',
                TEMP_OPTIONS,
                tempUnit,
                (v) => setTempUnit(v as any)
              )
            }
            style={styles.rowContainer}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
              <MaterialIcons name="thermostat" size={18} color="#FF6B6B" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Temperature</Text>
              <Text style={styles.rowSubtitle}>{getTempLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>

        {/* APP LANGUAGE */}
        <Text style={styles.sectionHeader}>APP LANGUAGE (MULTILINGUAL)</Text>
        <View style={styles.cardGroup}>
          {useLanguageStore.getState().supportedLanguages.map((lang, idx, arr) => {
            const currentLang = useLanguageStore.getState().currentLanguage;
            const isSelected = currentLang === lang.code;
            const isLast = idx === arr.length - 1;

            return (
              <TouchableOpacity
                key={lang.code}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                  void useLanguageStore.getState().setLanguage(lang.code as LanguageCode);
                  triggerToast(`Language switched to ${lang.nativeName} (${lang.name})`);
                }}
                style={[styles.rowContainer, !isLast && styles.rowBorder]}>
                <Text style={{ fontSize: 22, marginRight: 14 }}>{lang.flag}</Text>
                <View style={styles.textContainer}>
                  <Text style={styles.rowTitle}>{lang.nativeName}</Text>
                  <Text style={styles.rowSubtitle}>{lang.name} • {lang.region}</Text>
                </View>
                {isSelected ? (
                  <View style={styles.checkCircle}>
                    <MaterialIcons name="check" size={16} color="#002538" />
                  </View>
                ) : (
                  <View style={styles.uncheckCircle} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* REGIONAL FORMATS & CURRENCY */}
        <Text style={styles.sectionHeader}>DATE, TIME & REGIONAL</Text>
        <View style={styles.cardGroup}>
          {/* TIME FORMAT */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'Time Format',
                'schedule',
                '#A78BFA',
                TIME_FORMATS,
                timeFormat,
                (v) => setTimeFormat(v as any)
              )
            }
            style={[styles.rowContainer, styles.rowBorder]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <MaterialIcons name="schedule" size={18} color="#A78BFA" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Time Format</Text>
              <Text style={styles.rowSubtitle}>
                {timeFormat === '12h' ? '12-Hour (2:30 PM)' : '24-Hour (14:30)'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>

          {/* FIRST DAY OF WEEK */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              openPicker(
                'First Day of Week',
                'calendar-today',
                '#38BDF8',
                WEEK_START_OPTIONS,
                weekStart,
                (v) => setWeekStart(v as any)
              )
            }
            style={styles.rowContainer}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialIcons name="calendar-today" size={18} color="#38BDF8" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>First Day of Week</Text>
              <Text style={styles.rowSubtitle}>{getWeekStartLabel()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SELECTION PICKER MODAL */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: pickerModal.iconColor + '20' },
                  ]}>
                  <MaterialIcons
                    name={pickerModal.icon}
                    size={22}
                    color={pickerModal.iconColor}
                  />
                </View>
                <Text style={styles.modalTitle}>{pickerModal.title}</Text>
              </View>

              <Pressable
                onPress={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
                hitSlop={10}
                style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320, marginBottom: 12 }}>
              {pickerModal.options.map((opt) => {
                const isSelected = pickerModal.selectedValue === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => pickerModal.onSelect(opt.id)}
                    style={[
                      styles.pickerOptionRow,
                      isSelected && styles.pickerOptionRowSelected,
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.pickerOptionTitle,
                          isSelected && { color: '#89CEFF', fontFamily: F.sansBold },
                        ]}>
                        {opt.label}
                      </Text>
                      {opt.desc ? (
                        <Text style={styles.pickerOptionDesc}>{opt.desc}</Text>
                      ) : null}
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

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setResetModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <View style={styles.resetIconCircle}>
              <MaterialIcons name="restart-alt" size={28} color="#FF6B6B" />
            </View>

            <Text style={styles.resetModalTitle}>Reset Unit Preferences?</Text>
            <Text style={styles.resetModalSubtitle}>
              This will restore Metric units (kg, km, ml, °C), English language, and USD currency to defaults.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleResetDefaults}
                style={[styles.modalBtn, { backgroundColor: '#FF6B6B' }]}>
                <Text style={[styles.modalBtnText, { color: '#000000' }]}>Reset to Defaults</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setResetModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Text style={[styles.modalBtnText, { color: '#E0E3E6' }]}>Cancel</Text>
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
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  resetBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansMedium,
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

  /* LIVE PREVIEW CARD */
  previewCard: {
    borderRadius: Vital.radius.xxl,
    backgroundColor: C.surfaceContainer,
    padding: 18,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  previewIconWrap: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  previewSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 11.5,
    fontFamily: F.sans,
    marginTop: 2,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTile: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
  },
  previewTileLabel: {
    color: C.onSurfaceVariant,
    fontSize: 9.5,
    fontFamily: F.mono,
    letterSpacing: 0.8,
  },
  previewTileValue: {
    color: '#89CEFF',
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 4,
  },

  /* GLOBAL PRESET */
  presetContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    gap: 10,
  },
  presetBtnActive: {
    backgroundColor: '#89CEFF',
  },
  presetBtnTitle: {
    color: C.onSurface,
    fontSize: 13.5,
    fontFamily: F.sansBold,
  },
  presetBtnTitleActive: {
    color: '#002538',
  },
  presetBtnSub: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  presetBtnSubActive: {
    color: 'rgba(0, 37, 56, 0.8)',
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

  checkCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: '#89CEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  pickerOptionRowSelected: {
    backgroundColor: 'rgba(137, 206, 255, 0.12)',
  },
  pickerOptionTitle: {
    color: '#E0E3E6',
    fontSize: 13.5,
    fontFamily: F.sansMedium,
  },
  pickerOptionDesc: {
    color: '#9E9E9E',
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },

  resetIconCircle: {
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  resetModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: F.sansBold,
    textAlign: 'center',
  },
  resetModalSubtitle: {
    color: '#9E9E9E',
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
    gap: 8,
  },
  modalBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
});
