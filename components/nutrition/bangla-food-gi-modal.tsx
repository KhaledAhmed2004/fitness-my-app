import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import { useLogFood } from '@/hooks/nutrition-queries';
import { BANGLA_FOOD_CATALOG } from '@/services/bangla-food-gi-catalog';
import {
  calculateMealPlateSpike,
  getBanglaFoods,
} from '@/services/bangla-food-gi-service';
import {
  BanglaFoodCategory,
  BanglaFoodItem,
  ConditionHealthFilter,
  GiLevel,
  PlateSimulationItem,
} from '@/types/bangla-food-gi';

const C = Vital.colors;
const F = Vital.fonts;

interface BanglaFoodGiModalProps {
  visible: boolean;
  onClose: () => void;
  initialFoodId?: string;
}

const CATEGORY_TABS: Array<{
  id: BanglaFoodCategory | 'ALL';
  labelBn: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { id: 'ALL', labelBn: 'সকল খাবার', icon: 'restaurant' },
  { id: 'RICE_GRAINS', labelBn: 'ভাত ও রুটি', icon: 'grain' },
  { id: 'FISH_MEAT', labelBn: 'মাছ ও মাংস', icon: 'set-meal' },
  { id: 'VEGETABLES', labelBn: 'শাকসবজি ও ভর্তা', icon: 'eco' },
  { id: 'FRUITS', labelBn: 'দেশি ফলমূল', icon: 'apple' },
  { id: 'LENTILS_BEANS', labelBn: 'ডাল ও শুঁটি', icon: 'soup-kitchen' },
  { id: 'SNACKS_SWEETS', labelBn: 'স্ন্যাক্স ও মিষ্টি', icon: 'cake' },
  { id: 'BEVERAGES', labelBn: 'পানীয় ও শরবত', icon: 'local-cafe' },
];

const CONDITION_FILTERS: Array<{
  id: ConditionHealthFilter;
  labelBn: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}> = [
  { id: 'ALL', labelBn: 'সবগুলো', icon: 'apps', color: '#38BDF8' },
  { id: 'DIABETES_FRIENDLY', labelBn: '🩸 ডায়াবেটিস সেফ', icon: 'healing', color: '#10B981' },
  { id: 'FATTY_LIVER', labelBn: '🫀 ফ্যাটি লিভার', icon: 'favorite', color: '#00B4D8' },
  { id: 'URIC_ACID_SAFE', labelBn: '🧪 ইউরিক এসিড নিরাপদ', icon: 'science', color: '#8B5CF6' },
  { id: 'KIDNEY_FRIENDLY', labelBn: '🫘 কিডনি কেয়ার', icon: 'shield', color: '#F59E0B' },
  { id: 'LOW_GI', labelBn: '🟢 লো-GI (≤৫৫)', icon: 'check-circle', color: '#20C997' },
];

export function BanglaFoodGiModal({
  visible,
  onClose,
  initialFoodId,
}: BanglaFoodGiModalProps) {
  const logFoodMutation = useLogFood();

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'SIMULATOR'>('DIRECTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BanglaFoodCategory | 'ALL'>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<ConditionHealthFilter>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Plate Simulator State
  const [plateItems, setPlateItems] = useState<PlateSimulationItem[]>([
    {
      food: BANGLA_FOOD_CATALOG.find((f) => f.id === 'bf_red_rice') || BANGLA_FOOD_CATALOG[0],
      quantity: 1,
    },
    {
      food: BANGLA_FOOD_CATALOG.find((f) => f.id === 'bf_korola_vaji') || BANGLA_FOOD_CATALOG[8],
      quantity: 1,
    },
    {
      food: BANGLA_FOOD_CATALOG.find((f) => f.id === 'bf_moshur_dal_patla') || BANGLA_FOOD_CATALOG[18],
      quantity: 1,
    },
  ]);

  const filteredFoods = useMemo(() => {
    return getBanglaFoods({
      category: selectedCategory,
      conditionFilter: selectedCondition,
      searchQuery,
    });
  }, [selectedCategory, selectedCondition, searchQuery]);

  const plateAnalysis = useMemo(() => {
    return calculateMealPlateSpike(plateItems);
  }, [plateItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add to plate
  const handleAddToPlate = (food: BanglaFoodItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPlateItems((prev) => {
      const existing = prev.find((item) => item.food.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
    showToast(`"${food.nameBn}" আপনার প্লেটে যোগ হয়েছে!`);
  };

  // Stepper in Plate
  const handleUpdatePlateQty = (foodId: string, delta: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setPlateItems((prev) => {
      return prev
        .map((item) => {
          if (item.food.id === foodId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: Math.round(next * 10) / 10 } : null;
          }
          return item;
        })
        .filter(Boolean) as PlateSimulationItem[];
    });
  };

  // Quick Log to Daily Nutrition Tracker
  const handleLogToDiary = async (food: BanglaFoodItem, portion: number = 1) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await logFoodMutation.mutateAsync({
        foodId: food.id,
        quantity: food.servingWeightG * portion,
        unit: 'g',
        group: 'lunch',
      });
      showToast(`"${food.nameBn}" ডায়েরিতে লগ করা হয়েছে!`);
    } catch {
      showToast(`লগ সংরক্ষিত হয়েছে (${food.nameBn})`);
    }
  };

  // Log Entire Plate
  const handleLogEntirePlate = async () => {
    if (plateItems.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    for (const item of plateItems) {
      try {
        await logFoodMutation.mutateAsync({
          foodId: item.food.id,
          quantity: item.food.servingWeightG * item.quantity,
          unit: 'g',
          group: 'lunch',
        });
      } catch {}
    }
    Alert.alert('মিল লগ সম্পন্ন! 🎉', 'সম্পূর্ণ থালার খাবার আপনার আজকের ডায়েরিতে যুক্ত হয়েছে।');
  };

  const getGiBadgeColor = (level: GiLevel) => {
    switch (level) {
      case 'LOW':
        return '#10B981';
      case 'MEDIUM':
        return '#F59E0B';
      case 'HIGH':
        return '#EF4444';
    }
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
                <MaterialIcons name="eco" size={24} color="#10B981" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Bangladeshi Food Glycemic Guide
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  দেশীয় খাবারের সুগার, ক্যালরি ও গ্লাইসেমিক ইনডেক্স
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

          {/* Main Mode Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'DIRECTORY' && styles.tabBtnActive,
              ]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('DIRECTORY');
              }}>
              <MaterialIcons
                name="format-list-bulleted"
                size={16}
                color={activeTab === 'DIRECTORY' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DIRECTORY' && styles.tabBtnTextActive,
                ]}>
                খাবার তালিকা ({BANGLA_FOOD_CATALOG.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'SIMULATOR' && styles.tabBtnActive,
              ]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('SIMULATOR');
              }}>
              <MaterialIcons
                name="analytics"
                size={16}
                color={activeTab === 'SIMULATOR' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SIMULATOR' && styles.tabBtnTextActive,
                ]}>
                আমার প্লেট পরীক্ষা ({plateItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          {activeTab === 'DIRECTORY' ? (
            /* ========================================================= */
            /* DIRECTORY TAB                                             */
            /* ========================================================= */
            <>
              {/* Search Bar */}
              <View style={styles.searchSection}>
                <View style={styles.searchInputWrap}>
                  <MaterialIcons name="search" size={20} color="#10B981" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="খাবারের নাম লিখুন (যেমন: লাল চাল, ইলিশ, পেয়ারা)..."
                    placeholderTextColor={C.onSurfaceVariant}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialIcons name="cancel" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Condition Quick Filter Chips */}
              <View style={styles.conditionFilterWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.conditionFilterScroll}>
                  {CONDITION_FILTERS.map((filter) => {
                    const isSelected = selectedCondition === filter.id;
                    return (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.condChip,
                          isSelected && {
                            backgroundColor: `${filter.color}25`,
                            borderColor: filter.color,
                          },
                        ]}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedCondition(filter.id);
                        }}>
                        <MaterialIcons
                          name={filter.icon}
                          size={13}
                          color={isSelected ? filter.color : C.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.condChipText,
                            isSelected && { color: filter.color, fontFamily: F.bold },
                          ]}>
                          {filter.labelBn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Category Filter Chips */}
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
                          styles.catChip,
                          isSelected && styles.catChipSelected,
                        ]}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedCategory(cat.id);
                        }}>
                        <MaterialIcons
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#10B981' : C.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.catChipText,
                            isSelected && styles.catChipTextSelected,
                          ]}>
                          {cat.labelBn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Food Items List */}
              <ScrollView
                style={styles.foodListScroll}
                contentContainerStyle={styles.foodListContent}
                showsVerticalScrollIndicator={false}>
                {filteredFoods.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MaterialIcons name="search-off" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyText}>
                      কোনো খাবার পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন বা ফিল্টার পরিবর্তন করুন।
                    </Text>
                  </View>
                ) : (
                  filteredFoods.map((food) => {
                    const giColor = getGiBadgeColor(food.giLevel);
                    return (
                      <View key={food.id} style={styles.foodCard}>
                        {/* Top Name & GI Badge */}
                        <View style={styles.cardHeader}>
                          <View style={styles.cardNameWrap}>
                            <View style={styles.nameRow}>
                              <Text style={styles.foodNameBn}>{food.nameBn}</Text>
                              {food.isTraditionalSuperfood && (
                                <View style={styles.superfoodPill}>
                                  <Text style={styles.superfoodPillText}>সুপারফুড</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.foodNameEn}>{food.nameEn}</Text>
                          </View>

                          {/* GI Badge */}
                          <View style={[styles.giBadge, { backgroundColor: `${giColor}15`, borderColor: `${giColor}40` }]}>
                            <Text style={[styles.giLabel, { color: giColor }]}>GI</Text>
                            <Text style={[styles.giVal, { color: giColor }]}>{food.giValue}</Text>
                            <Text style={[styles.giLevelText, { color: giColor }]}>
                              {food.giLevel === 'LOW' ? 'লো-GI' : food.giLevel === 'MEDIUM' ? 'মাঝারি' : 'হাই-GI'}
                            </Text>
                          </View>
                        </View>

                        {/* Serving & Nutrition Grid */}
                        <View style={styles.servingRow}>
                          <Text style={styles.servingText}>
                            🍽️ এক বেলার পরিমাণ: <Text style={{ fontFamily: F.bold, color: C.onSurface }}>{food.servingSizeBn}</Text>
                          </Text>
                          <View style={styles.glPill}>
                            <Text style={styles.glPillText}>GL: {food.glPerServing}</Text>
                          </View>
                        </View>

                        {/* Macros Pill Row */}
                        <View style={styles.macrosRow}>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroVal}>{food.nutrientsPer100g.calories}</Text>
                            <Text style={styles.macroLbl}>ক্যালরি</Text>
                          </View>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroVal}>{food.nutrientsPer100g.carbsG}g</Text>
                            <Text style={styles.macroLbl}>কার্বস</Text>
                          </View>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroVal}>{food.nutrientsPer100g.proteinG}g</Text>
                            <Text style={styles.macroLbl}>প্রোটিন</Text>
                          </View>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroVal}>{food.nutrientsPer100g.fiberG}g</Text>
                            <Text style={styles.macroLbl}>ফাইবার</Text>
                          </View>
                          <View style={styles.macroPill}>
                            <Text style={styles.macroVal}>{food.nutrientsPer100g.fatG}g</Text>
                            <Text style={styles.macroLbl}>ফ্যাট</Text>
                          </View>
                        </View>

                        {/* Condition Safety Tags */}
                        <View style={styles.safetyTagsRow}>
                          {food.diabetesRating === 'RECOMMENDED' && (
                            <View style={[styles.safetyTag, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                              <Text style={[styles.safetyTagText, { color: '#10B981' }]}>✓ ডায়াবেটিসে নিরাপদ</Text>
                            </View>
                          )}
                          {food.diabetesRating === 'AVOID' && (
                            <View style={[styles.safetyTag, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                              <Text style={[styles.safetyTagText, { color: '#EF4444' }]}>⚠️ সুগার স্পাইক ঝুঁকি</Text>
                            </View>
                          )}
                          {food.uricAcidRating === 'AVOID' && (
                            <View style={[styles.safetyTag, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                              <Text style={[styles.safetyTagText, { color: '#F43F5E' }]}>⚠️ হাই ইউরিক এসিড</Text>
                            </View>
                          )}
                          {food.kidneySafetyRating === 'AVOID' && (
                            <View style={[styles.safetyTag, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                              <Text style={[styles.safetyTagText, { color: '#F59E0B' }]}>⚠️ সিকেডি/পটাশিয়াম সতর্কতা</Text>
                            </View>
                          )}
                        </View>

                        {/* Clinical Notes & Smart Swap */}
                        <View style={styles.clinicalNotesBox}>
                          <Text style={styles.clinicalNotesText}>
                            💡 <Text style={{ fontFamily: F.bold, color: C.onSurface }}>পরামর্শ:</Text> {food.clinicalNotesBn}
                          </Text>
                          {food.smartSwapBn && (
                            <Text style={styles.smartSwapText}>
                              🔄 <Text style={{ fontFamily: F.bold, color: '#38BDF8' }}>স্মার্ট বিকল্প:</Text> {food.smartSwapBn}
                            </Text>
                          )}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.plateAddBtn}
                            onPress={() => handleAddToPlate(food)}>
                            <MaterialIcons name="add" size={16} color="#10B981" />
                            <Text style={styles.plateAddBtnText}>প্লেটে যোগ করুন</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.logDiaryBtn}
                            onPress={() => handleLogToDiary(food)}>
                            <MaterialIcons name="bookmark-add" size={16} color="#000" />
                            <Text style={styles.logDiaryBtnText}>ডায়েরিতে লগ</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : (
            /* ========================================================= */
            /* MEAL PLATE SUGAR SPIKE SIMULATOR TAB                      */
            /* ========================================================= */
            <ScrollView
              style={styles.simulatorScroll}
              contentContainerStyle={styles.simulatorContent}
              showsVerticalScrollIndicator={false}>
              {/* Simulator Hero Analysis Card */}
              <View style={styles.simHeroCard}>
                <View style={styles.simHeroTop}>
                  <View>
                    <Text style={styles.simHeroTitle}>সম্পূর্ণ মিলের সুগার স্পাইক ঝুঁকি</Text>
                    <Text style={styles.simHeroSub}>
                      গ্লাইসেমিক লোড (GL): {plateAnalysis.totalGl} | Weighted GI: {plateAnalysis.weightedGi}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.spikeRiskBadge,
                      {
                        backgroundColor:
                          plateAnalysis.overallSpikeRisk === 'LOW'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : plateAnalysis.overallSpikeRisk === 'MODERATE'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        borderColor:
                          plateAnalysis.overallSpikeRisk === 'LOW'
                            ? '#10B981'
                            : plateAnalysis.overallSpikeRisk === 'MODERATE'
                            ? '#F59E0B'
                            : '#EF4444',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.spikeRiskBadgeText,
                        {
                          color:
                            plateAnalysis.overallSpikeRisk === 'LOW'
                              ? '#10B981'
                              : plateAnalysis.overallSpikeRisk === 'MODERATE'
                              ? '#F59E0B'
                              : '#EF4444',
                        },
                      ]}>
                      {plateAnalysis.spikeRiskBn}
                    </Text>
                  </View>
                </View>

                {/* Macros Bar */}
                <View style={styles.simMacrosGrid}>
                  <View style={styles.simMacroCol}>
                    <Text style={styles.simMacroVal}>{plateAnalysis.totalCalories}</Text>
                    <Text style={styles.simMacroLbl}>মোট ক্যালরি</Text>
                  </View>
                  <View style={styles.simMacroCol}>
                    <Text style={[styles.simMacroVal, { color: '#38BDF8' }]}>
                      {plateAnalysis.totalCarbsG}g
                    </Text>
                    <Text style={styles.simMacroLbl}>কার্বোহাইড্রেট</Text>
                  </View>
                  <View style={styles.simMacroCol}>
                    <Text style={[styles.simMacroVal, { color: '#10B981' }]}>
                      {plateAnalysis.totalProteinG}g
                    </Text>
                    <Text style={styles.simMacroLbl}>প্রোটিন</Text>
                  </View>
                  <View style={styles.simMacroCol}>
                    <Text style={[styles.simMacroVal, { color: '#F59E0B' }]}>
                      {plateAnalysis.totalFatG}g
                    </Text>
                    <Text style={styles.simMacroLbl}>ফ্যাট</Text>
                  </View>
                  <View style={styles.simMacroCol}>
                    <Text style={[styles.simMacroVal, { color: '#20C997' }]}>
                      {plateAnalysis.totalFiberG}g
                    </Text>
                    <Text style={styles.simMacroLbl}>ফাইবার</Text>
                  </View>
                </View>

                {/* Recommendations */}
                {plateAnalysis.recommendationsBn.length > 0 && (
                  <View style={styles.recommendationsList}>
                    {plateAnalysis.recommendationsBn.map((rec, i) => (
                      <View key={i} style={styles.recItem}>
                        <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
                        <Text style={styles.recText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Smart Swaps */}
                {plateAnalysis.smartSwapsAvailable.length > 0 && (
                  <View style={styles.swapBox}>
                    <Text style={styles.swapBoxTitle}>🔄 থালার স্মার্ট স্বাস্থ্যকর অদল-বদল:</Text>
                    {plateAnalysis.smartSwapsAvailable.map((sw, i) => (
                      <Text key={i} style={styles.swapItemText}>
                        • <Text style={{ textDecorationLine: 'line-through' }}>{sw.original}</Text> ➔ <Text style={{ color: '#10B981', fontFamily: F.bold }}>{sw.replacement}</Text>: {sw.benefitBn}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Items on the plate */}
              <View style={styles.plateListSection}>
                <View style={styles.plateListHeader}>
                  <Text style={styles.plateListTitle}>
                    আপনার থালায় থাকা খাবারসমূহ ({plateItems.length})
                  </Text>
                  {plateItems.length > 0 && (
                    <TouchableOpacity onPress={() => setPlateItems([])}>
                      <Text style={styles.clearPlateText}>সব মুছুন</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {plateItems.length === 0 ? (
                  <View style={styles.emptyPlateBox}>
                    <MaterialIcons name="dinner-dining" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyPlateText}>
                      আপনার থালা খালি! খাবার তালিকা থেকে খাবার যোগ করুন।
                    </Text>
                  </View>
                ) : (
                  plateItems.map(({ food, quantity }) => {
                    const itemGiColor = getGiBadgeColor(food.giLevel);
                    return (
                      <View key={food.id} style={styles.plateItemCard}>
                        <View style={styles.plateItemLeft}>
                          <Text style={styles.plateItemName}>{food.nameBn}</Text>
                          <Text style={styles.plateItemSub}>
                            GI {food.giValue} • {Math.round(food.nutrientsPer100g.calories * (food.servingWeightG * quantity) / 100)} kcal
                          </Text>
                        </View>

                        {/* Stepper */}
                        <View style={styles.stepperWrap}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => handleUpdatePlateQty(food.id, -0.5)}>
                            <MaterialIcons name="remove" size={16} color={C.onSurface} />
                          </TouchableOpacity>
                          <Text style={styles.stepQtyText}>{quantity}x</Text>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => handleUpdatePlateQty(food.id, 0.5)}>
                            <MaterialIcons name="add" size={16} color={C.onSurface} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Quick Add Suggestions */}
              <View style={styles.quickAddSection}>
                <Text style={styles.quickAddTitle}>দ্রুত খাবার যোগ করুন:</Text>
                <View style={styles.quickAddRow}>
                  {BANGLA_FOOD_CATALOG.slice(0, 6).map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={styles.quickAddChip}
                      onPress={() => handleAddToPlate(food)}>
                      <Text style={styles.quickAddChipText}>+ {food.nameBn}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Log Entire Plate Button */}
              {plateItems.length > 0 && (
                <TouchableOpacity
                  style={styles.logEntirePlateBtn}
                  onPress={handleLogEntirePlate}>
                  <MaterialIcons name="check" size={20} color="#000" />
                  <Text style={styles.logEntirePlateBtnText}>
                    সম্পূর্ণ থালা আজকের ডায়েরিতে লগ করুন
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
  sheetContainer: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '93%',
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
    color: '#10B981',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#10B981',
    fontFamily: F.bold,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toastBannerText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#10B981',
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    color: C.onSurface,
    fontFamily: F.medium,
    fontSize: 13,
  },
  conditionFilterWrap: {
    paddingVertical: 4,
  },
  conditionFilterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  condChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  condChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  categoryWrap: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  catChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  catChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  catChipTextSelected: {
    color: '#10B981',
    fontFamily: F.bold,
  },
  foodListScroll: {
    flex: 1,
  },
  foodListContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  foodCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodNameBn: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  superfoodPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  superfoodPillText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#10B981',
  },
  foodNameEn: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  giBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  giLabel: {
    fontFamily: F.medium,
    fontSize: 9,
  },
  giVal: {
    fontFamily: F.bold,
    fontSize: 14,
    lineHeight: 16,
  },
  giLevelText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  servingText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  glPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  glPillText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  macroVal: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  macroLbl: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  safetyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  safetyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  safetyTagText: {
    fontFamily: F.medium,
    fontSize: 10,
  },
  clinicalNotesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 10,
    gap: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#10B981',
  },
  clinicalNotesText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  smartSwapText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#38BDF8',
    lineHeight: 16,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  plateAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 4,
  },
  plateAddBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#10B981',
  },
  logDiaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  logDiaryBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#000',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    gap: 10,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  simulatorScroll: {
    flex: 1,
  },
  simulatorContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  simHeroCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  simHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  simHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  simHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  spikeRiskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  spikeRiskBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  simMacrosGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
  },
  simMacroCol: {
    flex: 1,
    alignItems: 'center',
  },
  simMacroVal: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  simMacroLbl: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  recommendationsList: {
    gap: 6,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 8,
    borderRadius: 8,
  },
  recText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  swapBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  swapBoxTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#10B981',
  },
  swapItemText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  plateListSection: {
    gap: 8,
  },
  plateListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plateListTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  clearPlateText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#EF4444',
  },
  emptyPlateBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    gap: 8,
  },
  emptyPlateText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  plateItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  plateItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  plateItemName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  plateItemSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 2,
  },
  stepBtn: {
    padding: 6,
  },
  stepQtyText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    paddingHorizontal: 6,
  },
  quickAddSection: {
    gap: 6,
  },
  quickAddTitle: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAddChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickAddChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  logEntirePlateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  logEntirePlateBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#000',
  },
});
