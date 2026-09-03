import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { GenericMedicineService } from '@/services/generic-medicine-service';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  MedicineBrandItem,
  TherapeuticCategory,
} from '@/types/generic-medicine';

const C = Vital.colors;
const F = Vital.fonts;

interface GenericMedicineFinderModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const CATEGORY_TABS: Array<{ id: TherapeuticCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { id: 'ALL', label: 'সবগুলো', icon: 'apps' },
  { id: 'ANALGESIC_FEVER', label: 'জ্বর ও ব্যথা', icon: 'healing' },
  { id: 'GASTRIC_PPI', label: 'গ্যাস্ট্রিক ও আলসার', icon: 'local-fire-department' },
  { id: 'RESPIRATORY_ALLERGY', label: 'অ্যালার্জি ও হাঁপানি', icon: 'air' },
  { id: 'ANTIBIOTIC', label: 'অ্যান্টিবায়োটিক', icon: 'shield' },
  { id: 'CARDIOVASCULAR_BP', label: 'ব্লাড প্রেশার ও হার্ট', icon: 'favorite' },
  { id: 'DIABETES', label: 'ডায়াবেটিস', icon: 'water-drop' },
];

const POPULAR_SEARCH_SUGGESTIONS = [
  'Napa Extra',
  'Seclo 20',
  'Sergel 20',
  'Monas 10',
  'Fexo 120',
  'Zithrin 500',
  'Angilock 50',
  'Lipicon 10',
  'Comet 500',
];

const COMPANY_COLORS: Record<string, string> = {
  Square: '#0284C7',
  Beximco: '#E11D48',
  Incepta: '#10B981',
  Healthcare: '#8B5CF6',
  Acme: '#F59E0B',
  Renata: '#06B6D4',
  Aristopharma: '#EC4899',
  'SK+F': '#14B8A6',
  Opsonin: '#3B82F6',
  UniMed: '#6366F1',
};

export function GenericMedicineFinderModal({
  visible,
  onClose,
  initialQuery = '',
}: GenericMedicineFinderModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<TherapeuticCategory>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<MedicineBrandItem | null>(null);
  const [selectedStrength, setSelectedStrength] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const addMedicine = useMedicineStore((s) => s.addMedicine);

  // Search Results
  const searchResults = useMemo(() => {
    return GenericMedicineService.search(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // If a brand or molecule is selected, compute alternatives
  const comparisonResult = useMemo(() => {
    if (selectedBrand) {
      return GenericMedicineService.getAlternativesForBrand(
        selectedBrand.id,
        selectedStrength || selectedBrand.strength
      );
    }
    if (searchQuery.trim().length >= 2 && searchResults.brands.length > 0) {
      return GenericMedicineService.getAlternativesForBrand(
        searchResults.brands[0].id,
        selectedStrength
      );
    }
    return null;
  }, [selectedBrand, searchQuery, searchResults.brands, selectedStrength]);

  const handleSelectBrand = (brand: MedicineBrandItem) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedBrand(brand);
    setSelectedStrength(brand.strength);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedBrand(null);
    setSelectedStrength('');
  };

  const handleAddToCabinet = (brand: MedicineBrandItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    addMedicine({
      name: brand.brandName,
      type: 'medicine',
      formFactor: brand.dosageForm === 'CAPSULE' ? 'capsule' : 'pill',
      strength: brand.strength,
      unit: 'pill',
      instructions: brand.adultDose,
      trackInventory: true,
      currentStock: brand.stripSize,
      totalPackSize: brand.stripSize,
      lowStockThreshold: 3,
      isAsNeeded: false,
      isCourse: brand.genericId.includes('antibiotic'),
      schedules: [
        {
          id: `sch_${Date.now()}`,
          time: '09:00 AM',
          timeCategory: 'morning',
          doseAmount: 1,
          instructions: 'খাবারের পর',
        },
      ],
    });

    Alert.alert(
      'ক্যাবিনেটে যুক্ত হয়েছে! 🎉',
      `"${brand.brandName} (${brand.strength}) - ${brand.shortCompany}" সফলভাবে আপনার মেডিসিন ক্যাবিনেটে যুক্ত করা হয়েছে।`,
      [{ text: 'ঠিক আছে' }]
    );
  };

  const handleCopyDetails = async (brand: MedicineBrandItem) => {
    const text = `💊 ঔষধের নাম: ${brand.brandName} (${brand.strength})\nজেনেরিক: ${brand.genericName}\nকোম্পানি: ${brand.manufacturer}\nএমআরপি মূল্য: ৳${brand.unitPriceBdt.toFixed(2)} / পিস (৳${brand.stripPriceBdt.toFixed(2)} / ${brand.stripSize}টির পাতা)\nনির্দেশনা: ${brand.indicationsBn}`;
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopiedToast(brand.brandName);
    setTimeout(() => setCopiedToast(null), 3000);
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
                <MaterialIcons name="medication" size={24} color="#00B4D8" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Generic Medicine Alternative Finder
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  জেনেরিক বিকল্প, সমমানের শক্তি ও MRP দাম তুলনা
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

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputWrap}>
              <MaterialIcons name="search" size={22} color="#00B4D8" />
              <TextInput
                style={styles.searchInput}
                placeholder="যেকোনো ঔষধের নাম লিখুন (যেমন: Napa Extra, Seclo)..."
                placeholderTextColor={C.onSurfaceVariant}
                value={searchQuery}
                onChangeText={(val) => {
                  setSearchQuery(val);
                  if (selectedBrand && !val.toLowerCase().includes(selectedBrand.brandName.toLowerCase())) {
                    setSelectedBrand(null);
                  }
                }}
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <MaterialIcons name="cancel" size={18} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Chips Scroll */}
          <View style={styles.categoryWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {CATEGORY_TABS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setSelectedCategory(cat.id);
                    }}>
                    <MaterialIcons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#00B4D8' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Copied Toast Banner */}
          {copiedToast && (
            <View style={styles.toastBanner}>
              <MaterialIcons name="check-circle" size={16} color="#51CF66" />
              <Text style={styles.toastBannerText}>
                "{copiedToast}" এর তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!
              </Text>
            </View>
          )}

          {/* Content Area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
            showsVerticalScrollIndicator={false}>
            {/* 1. If an active comparison result exists */}
            {comparisonResult ? (
              <View style={styles.comparisonContainer}>
                {/* Molecule Card */}
                <View style={styles.moleculeHeroCard}>
                  <View style={styles.moleculeTopRow}>
                    <View style={styles.moleculeBadge}>
                      <MaterialIcons name="science" size={14} color="#00B4D8" />
                      <Text style={styles.moleculeBadgeText}>
                        {comparisonResult.molecule.classLabelBn}
                      </Text>
                    </View>
                    <Text style={styles.totalAlternativesCount}>
                      {comparisonResult.alternatives.length}টি সমমানের ব্র্যান্ড
                    </Text>
                  </View>

                  <Text style={styles.genericTitle}>
                    {comparisonResult.molecule.genericName}
                  </Text>
                  <Text style={styles.genericSubtitle}>
                    {comparisonResult.molecule.bengaliGenericName}
                  </Text>
                  <Text style={styles.genericOverview}>
                    {comparisonResult.molecule.overviewBn}
                  </Text>

                  {/* Strengths Selector Tabs */}
                  {comparisonResult.molecule.standardStrengths.length > 1 && (
                    <View style={styles.strengthsRow}>
                      <Text style={styles.strengthsLabel}>পাওয়ার / শক্তি:</Text>
                      {comparisonResult.molecule.standardStrengths.map((str) => {
                        const isMatch = (selectedStrength || comparisonResult.matchingStrength) === str;
                        return (
                          <TouchableOpacity
                            key={str}
                            style={[
                              styles.strengthTab,
                              isMatch && styles.strengthTabSelected,
                            ]}
                            onPress={() => {
                              void Haptics.selectionAsync().catch(() => {});
                              setSelectedStrength(str);
                            }}>
                            <Text
                              style={[
                                styles.strengthTabText,
                                isMatch && styles.strengthTabTextSelected,
                              ]}>
                              {str}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Clinical Tips & Warnings */}
                  {comparisonResult.searchedBrand?.safetyWarningsBn && (
                    <View style={styles.warningBox}>
                      <MaterialIcons name="info-outline" size={15} color="#FF922B" />
                      <Text style={styles.warningText}>
                        {comparisonResult.searchedBrand.safetyWarningsBn}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Alternatives List */}
                <View style={styles.alternativesSection}>
                  <View style={styles.alternativesHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>
                      সমমানের ব্র্যান্ড ও সরকারি MRP খুচরা মূল্য
                    </Text>
                    {comparisonResult.priceSavingsPercentage > 0 && (
                      <View style={styles.savingsChip}>
                        <Text style={styles.savingsChipText}>
                          সর্বোচ্চ {comparisonResult.priceSavingsPercentage}% সাশ্রয়ী
                        </Text>
                      </View>
                    )}
                  </View>

                  {comparisonResult.alternatives.map((item, idx) => {
                    const isLowest = item.id === comparisonResult.cheapestAlternative?.id;
                    const isCurrentSearched = item.id === selectedBrand?.id;
                    const companyColor = COMPANY_COLORS[item.shortCompany] || '#38BDF8';

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.brandCard,
                          isCurrentSearched && styles.brandCardSelected,
                        ]}>
                        <View style={styles.brandCardTop}>
                          <View style={styles.brandNameWrap}>
                            <View style={styles.brandTitleRow}>
                              <Text style={styles.brandNameText}>
                                {item.brandName}
                              </Text>
                              <View
                                style={[
                                  styles.companyBadge,
                                  { backgroundColor: `${companyColor}20`, borderColor: companyColor },
                                ]}>
                                <Text style={[styles.companyBadgeText, { color: companyColor }]}>
                                  {item.shortCompany}
                                </Text>
                              </View>
                              {isLowest && (
                                <View style={styles.lowestPriceBadge}>
                                  <Text style={styles.lowestPriceBadgeText}>
                                    সবচেয়ে কম দাম
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.brandManufacturerText}>
                              {item.manufacturer} • {item.dosageForm}
                            </Text>
                          </View>

                          {/* Price Tag */}
                          <View style={styles.priceTagWrap}>
                            <Text style={styles.unitPriceText}>
                              ৳{item.unitPriceBdt.toFixed(2)}
                              <Text style={styles.unitSub}> /পিস</Text>
                            </Text>
                            <Text style={styles.stripPriceText}>
                              ৳{item.stripPriceBdt.toFixed(2)} ({item.stripSize}টির পাতা)
                            </Text>
                          </View>
                        </View>

                        {/* Indication / Dose */}
                        <View style={styles.brandCardDetails}>
                          <Text style={styles.doseInfoText}>
                            <Text style={{ fontFamily: F.bold, color: C.onSurface }}>ডোজ:</Text> {item.adultDose}
                          </Text>
                        </View>

                        {/* Actions Row */}
                        <View style={styles.brandCardActions}>
                          <TouchableOpacity
                            style={styles.copyActionBtn}
                            onPress={() => handleCopyDetails(item)}>
                            <MaterialIcons name="content-copy" size={15} color={C.onSurfaceVariant} />
                            <Text style={styles.copyActionBtnText}>শেয়ার / কপি</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.addToCabinetBtn}
                            onPress={() => handleAddToCabinet(item)}>
                            <MaterialIcons name="add" size={16} color="#000" />
                            <Text style={styles.addToCabinetBtnText}>
                              ক্যাবিনেটে যোগ করুন
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* 2. No active search / Initial Suggestions state */
              <View style={styles.emptyStateContainer}>
                {/* Search suggestions */}
                <View style={styles.suggestionsCard}>
                  <View style={styles.suggestionsHeader}>
                    <MaterialIcons name="local-pharmacy" size={18} color="#00B4D8" />
                    <Text style={styles.suggestionsTitle}>
                      জনপ্রিয় ঔষধের জেনেরিক বিকল্প খুঁজুন
                    </Text>
                  </View>
                  <View style={styles.suggestionsChipsWrap}>
                    {POPULAR_SEARCH_SUGGESTIONS.map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={styles.suggestChip}
                        onPress={() => {
                          setSearchQuery(sug);
                          const res = GenericMedicineService.getAlternativesForBrand(sug);
                          if (res?.searchedBrand) {
                            setSelectedBrand(res.searchedBrand);
                          }
                        }}>
                        <MaterialIcons name="search" size={13} color="#00B4D8" />
                        <Text style={styles.suggestChipText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Available Catalog Molecules */}
                <View style={styles.allMoleculesList}>
                  <Text style={styles.sectionHeaderTitle}>
                    ক্যাটালগে অন্তর্ভুক্ত জেনেরিক গ্রুপসমূহ ({searchResults.molecules.length})
                  </Text>
                  {searchResults.molecules.map((mol) => (
                    <TouchableOpacity
                      key={mol.id}
                      style={styles.moleculeSummaryCard}
                      onPress={() => {
                        if (mol.brands.length > 0) {
                          handleSelectBrand(mol.brands[0]);
                        }
                      }}>
                      <View style={styles.moleculeSummaryLeft}>
                        <View style={styles.molCircle}>
                          <MaterialIcons name="medication" size={18} color="#00B4D8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.molSummaryName}>{mol.genericName}</Text>
                          <Text style={styles.molSummaryBn}>{mol.bengaliGenericName}</Text>
                          <Text style={styles.molSummaryClass}>{mol.classLabelBn}</Text>
                        </View>
                      </View>
                      <View style={styles.molSummaryRight}>
                        <Text style={styles.molBrandCountText}>
                          {mol.brands.length}টি ব্র্যান্ড
                        </Text>
                        <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    color: '#00B4D8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: C.onSurface,
    fontFamily: F.medium,
    fontSize: 13,
  },
  clearBtn: {
    padding: 4,
  },
  categoryWrap: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: '#00B4D8',
  },
  categoryChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  categoryChipTextSelected: {
    color: '#00B4D8',
    fontFamily: F.bold,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(81, 207, 102, 0.3)',
  },
  toastBannerText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#51CF66',
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  comparisonContainer: {
    gap: 16,
  },
  moleculeHeroCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  moleculeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moleculeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  moleculeBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#00B4D8',
  },
  totalAlternativesCount: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  genericTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.onSurface,
  },
  genericSubtitle: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#00B4D8',
  },
  genericOverview: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 2,
  },
  strengthsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  strengthsLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  strengthTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strengthTabSelected: {
    backgroundColor: '#00B4D8',
  },
  strengthTabText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  strengthTabTextSelected: {
    color: '#000',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  warningText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#FF922B',
    flex: 1,
  },
  alternativesSection: {
    gap: 10,
  },
  alternativesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  savingsChip: {
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savingsChipText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#51CF66',
  },
  brandCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  brandCardSelected: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.04)',
  },
  brandCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandNameWrap: {
    flex: 1,
    marginRight: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandNameText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  companyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  companyBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  lowestPriceBadge: {
    backgroundColor: 'rgba(81, 207, 102, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lowestPriceBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#51CF66',
  },
  brandManufacturerText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  priceTagWrap: {
    alignItems: 'flex-end',
  },
  unitPriceText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#51CF66',
  },
  unitSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  stripPriceText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  brandCardDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
  },
  doseInfoText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  brandCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  copyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  copyActionBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  addToCabinetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#00B4D8',
    gap: 4,
  },
  addToCabinetBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#000',
  },
  emptyStateContainer: {
    gap: 16,
  },
  suggestionsCard: {
    backgroundColor: 'rgba(0, 180, 216, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.15)',
    gap: 10,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionsTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  suggestionsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  suggestChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  allMoleculesList: {
    gap: 10,
  },
  moleculeSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moleculeSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  molCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  molSummaryName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  molSummaryBn: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#00B4D8',
  },
  molSummaryClass: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  molSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  molBrandCountText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
});
