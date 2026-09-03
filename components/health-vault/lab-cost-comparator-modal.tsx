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
import { DIAGNOSTIC_CENTERS } from '@/services/lab-cost-knowledge';
import {
  calculateBasketComparison,
  formatBasketShareText,
  searchLabTests,
} from '@/services/lab-cost-service';
import {
  DiagnosticCenterInfo,
  LabTestCategory,
  LabTestPriceItem,
} from '@/types/lab-cost-comparator';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'TEST_SEARCH' | 'BASKET_CALCULATOR' | 'HOME_COLLECTION' | 'PREPARATION_GUIDE';

const CATEGORY_TABS: Array<{ id: LabTestCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { id: 'ALL', label: 'সবগুলো', icon: 'apps' },
  { id: 'BLOOD_ROUTINE', label: 'রক্তের রুটিন', icon: 'bloodtype' },
  { id: 'DIABETES_GLUCOSE', label: 'ডায়াবেটিস', icon: 'water-drop' },
  { id: 'KIDNEY_LIVER', label: 'কিডনি ও লিভার', icon: 'science' },
  { id: 'HEART_LIPID', label: 'হার্ট ও চর্বি', icon: 'favorite' },
  { id: 'THYROID_HORMONE', label: 'থাইরয়েড ও ভিটামিন', icon: 'healing' },
  { id: 'IMAGING_ULTRASOUND', label: 'আল্ট্রাসনোগ্রাম ও এক্স-রে', icon: 'camera-alt' },
  { id: 'URINE_STOOL', label: 'ইউরিন ও অন্যান্য', icon: 'biotech' },
];

interface LabCostComparatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialTestIds?: string[];
}

export function LabCostComparatorModal({
  visible,
  onClose,
  initialTestIds = ['test_cbc', 'test_hba1c', 'test_lipid_profile', 'test_creatinine'],
}: LabCostComparatorModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('TEST_SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LabTestCategory>('ALL');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(initialTestIds);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Search Results
  const searchResults = useMemo(() => {
    return searchLabTests(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Basket Comparison
  const basketComparison = useMemo(() => {
    return calculateBasketComparison(selectedTestIds);
  }, [selectedTestIds]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleToggleTestInBasket = (testId: string) => {
    void Haptics.selectionAsync().catch(() => {});
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds((prev) => prev.filter((id) => id !== testId));
      showToast('বাস্কেট থেকে সরানো হয়েছে');
    } else {
      setSelectedTestIds((prev) => [...prev, testId]);
      showToast('বাস্কেটে যুক্ত হয়েছে 🛒');
    }
  };

  const handleCopyEstimate = async () => {
    if (!basketComparison) return;
    const fullText = formatBasketShareText(basketComparison);
    await Clipboard.setStringAsync(fullText);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('তুলনামূলক এস্টিমেট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    if (!basketComparison) return;
    const fullText = formatBasketShareText(basketComparison);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(fullText)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে এস্টিমেট কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const handleCallCenter = (phone: string, centerName: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('কল করা সম্ভব হয়নি', `${centerName} হটলাইন: ${phone}`);
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
                <MaterialIcons name="science" size={24} color="#0284C7" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Diagnostic Lab Cost Comparator
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ল্যাব টেস্টের খরচ ও ডায়াগনস্টিক তুলনা
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
              onPress={() => setActiveTab('TEST_SEARCH')}
              style={[styles.tabBtn, activeTab === 'TEST_SEARCH' && styles.tabBtnActive]}>
              <MaterialIcons
                name="search"
                size={16}
                color={activeTab === 'TEST_SEARCH' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'TEST_SEARCH' && styles.tabBtnTextActive,
                ]}>
                🔍 টেস্ট মূল্য
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('BASKET_CALCULATOR')}
              style={[
                styles.tabBtn,
                activeTab === 'BASKET_CALCULATOR' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="shopping-basket"
                size={16}
                color={activeTab === 'BASKET_CALCULATOR' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'BASKET_CALCULATOR' && styles.tabBtnTextActive,
                ]}>
                🛒 প্রেসক্রিপশন বাস্কেট ({selectedTestIds.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('HOME_COLLECTION')}
              style={[
                styles.tabBtn,
                activeTab === 'HOME_COLLECTION' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="home"
                size={16}
                color={activeTab === 'HOME_COLLECTION' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'HOME_COLLECTION' && styles.tabBtnTextActive,
                ]}>
                🏠 হোম স্যাম্পল
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PREPARATION_GUIDE')}
              style={[
                styles.tabBtn,
                activeTab === 'PREPARATION_GUIDE' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="rule"
                size={16}
                color={activeTab === 'PREPARATION_GUIDE' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PREPARATION_GUIDE' && styles.tabBtnTextActive,
                ]}>
                🥣 পূর্বপ্রস্তুতি
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
            {/* TAB 1: TEST SEARCH & PRICES */}
            {/* ========================================================================= */}
            {activeTab === 'TEST_SEARCH' && (
              <>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={20} color={C.onSurfaceVariant} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="টেস্টের নাম বা কোড দিয়ে খুঁজুন (e.g. CBC, Lipid, HbA1c)..."
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

                {/* Category Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catPillScroll}>
                  {CATEGORY_TABS.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedCategory(cat.id);
                        }}
                        style={[
                          styles.catPill,
                          isSelected && styles.catPillActive,
                        ]}>
                        <MaterialIcons
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#0284C7' : C.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.catPillText,
                            isSelected && styles.catPillTextActive,
                          ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Results Count & Basket Link */}
                <View style={styles.resultsMetaRow}>
                  <Text style={styles.resultsCountText}>
                    {searchResults.length}টি টেস্ট পাওয়া গেছে
                  </Text>
                  {selectedTestIds.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setActiveTab('BASKET_CALCULATOR')}
                      style={styles.basketQuickLink}>
                      <MaterialIcons name="shopping-basket" size={14} color="#0284C7" />
                      <Text style={styles.basketQuickLinkText}>
                        বাস্কেটের মোট হিসাব দেখুন ({selectedTestIds.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Test Cards List */}
                {searchResults.map((test) => {
                  const isInBasket = selectedTestIds.includes(test.id);
                  return (
                    <View key={test.id} style={styles.testCard}>
                      <View style={styles.testCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.testCodeRow}>
                            <Text style={styles.testNameBn}>{test.nameBn}</Text>
                            <View style={styles.testCodeBadge}>
                              <Text style={styles.testCodeBadgeText}>{test.code}</Text>
                            </View>
                          </View>
                          <Text style={styles.testNameEn}>{test.nameEn}</Text>
                          <Text style={styles.testDesc}>{test.shortDescriptionBn}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleToggleTestInBasket(test.id)}
                          style={[
                            styles.basketAddBtn,
                            isInBasket && styles.basketAddBtnActive,
                          ]}>
                          <MaterialIcons
                            name={isInBasket ? 'check' : 'add'}
                            size={16}
                            color={isInBasket ? '#FFFFFF' : '#0284C7'}
                          />
                          <Text
                            style={[
                              styles.basketAddBtnText,
                              isInBasket && styles.basketAddBtnTextActive,
                            ]}>
                            {isInBasket ? 'যুক্ত' : '+ বাস্কেট'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Fasting & Preparation Alert if applicable */}
                      {test.fastingHours > 0 && (
                        <View style={styles.fastingAlertBox}>
                          <MaterialIcons name="alarm" size={12} color="#F59E0B" />
                          <Text style={styles.fastingAlertText}>
                            {test.preparationRuleBn}
                          </Text>
                        </View>
                      )}

                      {/* Center Price Comparison Grid */}
                      <View style={styles.priceGrid}>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>পপুলার:</Text>
                          <Text style={styles.centerPrice}>৳ {test.prices.POPULAR}</Text>
                        </View>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>ইবনে সিনা:</Text>
                          <Text style={styles.centerPrice}>৳ {test.prices.IBN_SINA}</Text>
                        </View>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>ল্যাবএইড:</Text>
                          <Text style={styles.centerPrice}>৳ {test.prices.LABAID}</Text>
                        </View>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>প্রাভা:</Text>
                          <Text style={styles.centerPrice}>৳ {test.prices.PRAAVA}</Text>
                        </View>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>থাইরোকেয়ার:</Text>
                          <Text style={styles.centerPrice}>৳ {test.prices.THYROCARE}</Text>
                        </View>
                        <View style={styles.pricePill}>
                          <Text style={styles.centerTag}>বিএসএমএমইউ (পিজি):</Text>
                          <Text style={[styles.centerPrice, { color: '#10B981' }]}>
                            ৳ {test.prices.BSMMU_GOVT}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: BASKET CALCULATOR & SAVINGS */}
            {/* ========================================================================= */}
            {activeTab === 'BASKET_CALCULATOR' && (
              <>
                {basketComparison ? (
                  <>
                    {/* Best Value Hero Banner */}
                    <View style={styles.bestValueHero}>
                      <View style={styles.trophyCircle}>
                        <MaterialIcons name="emoji-events" size={26} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bestValueTitle}>
                          সবচেয়ে সাশ্রয়ী: {basketComparison.cheapestCenter.nameBn}
                        </Text>
                        <Text style={styles.bestValueSub}>
                          নির্বাচিত {basketComparison.selectedTests.length}টি টেস্টের মোট খরচ ৳{' '}
                          {basketComparison.centerTotals[0].totalCost.toLocaleString('bn-BD')} •
                          সর্বোচ্চ ৳ {basketComparison.maxSavingsAmount.toLocaleString('bn-BD')} সাশ্রয়!
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons: Copy & Share */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={handleCopyEstimate}
                        style={styles.copyEstimateBtn}>
                        <MaterialIcons name="content-copy" size={16} color="#0F172A" />
                        <Text style={styles.copyEstimateText}>এস্টিমেট কপি করুন</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleWhatsAppShare}
                        style={styles.waEstimateBtn}>
                        <MaterialIcons name="share" size={16} color="#25D366" />
                        <Text style={styles.waEstimateText}>WhatsApp-এ পাঠান</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Selected Tests Tags */}
                    <View style={styles.selectedSection}>
                      <Text style={styles.sectionTitle}>
                        বাস্কেটে থাকা টেস্টসমূহ ({basketComparison.selectedTests.length}টি):
                      </Text>
                      <View style={styles.selectedTagsWrap}>
                        {basketComparison.selectedTests.map((t) => (
                          <TouchableOpacity
                            key={t.id}
                            onPress={() => handleToggleTestInBasket(t.id)}
                            style={styles.selectedTag}>
                            <Text style={styles.selectedTagText}>
                              {t.nameBn} (গড়: ৳{t.averagePrice})
                            </Text>
                            <MaterialIcons name="close" size={14} color={C.onSurfaceVariant} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Ranked Diagnostic Center Cards */}
                    <Text style={styles.sectionTitle}>
                      ডায়াগনস্টিক সেন্টারের মোট খরচের তুলনা:
                    </Text>

                    {basketComparison.centerTotals.map((item, idx) => (
                      <View
                        key={item.center.id}
                        style={[
                          styles.centerBillCard,
                          item.isCheapest && styles.centerBillCardCheapest,
                        ]}>
                        <View style={styles.centerBillTop}>
                          <View style={styles.centerNumCircle}>
                            <Text style={styles.centerNumText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.centerNameRow}>
                              <Text style={styles.centerNameBn}>
                                {item.center.nameBn}
                              </Text>
                              {item.isCheapest && (
                                <View style={styles.bestBadge}>
                                  <Text style={styles.bestBadgeText}>
                                    🏆 BEST VALUE
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.centerSubText}>
                              {item.center.branchCountBn}
                            </Text>
                          </View>

                          <View style={styles.centerPriceCol}>
                            <Text style={styles.centerTotalAmount}>
                              ৳ {item.totalCost.toLocaleString('bn-BD')}
                            </Text>
                            {item.savingsVsHighest > 0 ? (
                              <Text style={styles.centerSavingsText}>
                                ৳ {item.savingsVsHighest.toLocaleString('bn-BD')} সাশ্রয়
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.centerCardBottom}>
                          <Text style={styles.centerDiscountNote}>
                            💡 {item.center.discountNoteBn}
                          </Text>
                          {item.center.homeSampleAvailable && (
                            <TouchableOpacity
                              onPress={() =>
                                handleCallCenter(item.center.hotline, item.center.nameBn)
                              }
                              style={styles.callHotlineBtn}>
                              <MaterialIcons name="call" size={12} color="#0284C7" />
                              <Text style={styles.callHotlineText}>
                                কল করুন ({item.center.hotline})
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyBasketWrap}>
                    <MaterialIcons name="remove-shopping-cart" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyBasketTitle}>বাস্কেট খালি রয়েছে</Text>
                    <Text style={styles.emptyBasketSub}>
                      টেস্ট সার্চ ট্যাব থেকে প্রেসক্রিপশনের টেস্টগুলো বাস্কেটে যুক্ত করুন।
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveTab('TEST_SEARCH')}
                      style={styles.startSearchBtn}>
                      <Text style={styles.startSearchBtnText}>টেস্ট বাছাই করুন</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: HOME SAMPLE COLLECTION HOTLINES */}
            {/* ========================================================================= */}
            {activeTab === 'HOME_COLLECTION' && (
              <>
                <View style={styles.homeHeroCard}>
                  <MaterialIcons name="local-hospital" size={24} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.homeHeroTitle}>
                      বাসা থেকে রক্ত ও নমুনা সংগ্রহ সার্ভিস
                    </Text>
                    <Text style={styles.homeHeroSub}>
                      বয়স্ক ও অসুস্থ রোগীদের ক্লিনিকে যাওয়ার ঝামেলা ছাড়াই দক্ষ ল্যাব
                      টেকনিশিয়ান দ্বারা ডোরস্টেপ ব্লাড ড্র ও হোম কালেকশন।
                    </Text>
                  </View>
                </View>

                {DIAGNOSTIC_CENTERS.filter((c) => c.homeSampleAvailable).map((center) => (
                  <View key={center.id} style={styles.homeCenterCard}>
                    <View style={styles.homeCenterTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.homeCenterName}>{center.nameBn}</Text>
                        <Text style={styles.homeCenterSub}>{center.branchCountBn}</Text>
                      </View>
                      <View style={styles.homeFeeBadge}>
                        <Text style={styles.homeFeeText}>{center.homeSampleFeeBn}</Text>
                      </View>
                    </View>

                    <Text style={styles.homeDiscount}>{center.discountNoteBn}</Text>

                    <TouchableOpacity
                      onPress={() => handleCallCenter(center.hotline, center.nameBn)}
                      style={styles.directCallBtn}>
                      <MaterialIcons name="call" size={16} color="#FFFFFF" />
                      <Text style={styles.directCallText}>
                        হোম কালেকশনের জন্য কল করুন ({center.hotline})
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: PREPARATION & FASTING RULES */}
            {/* ========================================================================= */}
            {activeTab === 'PREPARATION_GUIDE' && (
              <>
                <View style={styles.prepCard}>
                  <MaterialIcons name="alarm" size={20} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prepTitle}>১. লিপিড প্রোফাইল (রক্তের চর্বি)</Text>
                    <Text style={styles.prepBody}>
                      টেস্টের আগে টানা ১০ থেকে ১২ ঘণ্টা সম্পূর্ণ খালি পেটে থাকতে হবে। কোনো চা,
                      কফি, দুধ বা হালকা নাস্তা খাওয়া সম্পূর্ণ নিষেধ। তবে পর্যাপ্ত সাধারণ পানি পান
                      করা যাবে।
                    </Text>
                  </View>
                </View>

                <View style={styles.prepCard}>
                  <MaterialIcons name="water-drop" size={20} color="#0284C7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prepTitle}>২. ফাস্টিং সুগার ও নাস্তার ২ ঘণ্টা পর (FBS & 2HABF)</Text>
                    <Text style={styles.prepBody}>
                      ফাস্টিং সুগারের জন্য রাতে ৮ থেকে ১০ ঘণ্টা না খেয়ে সকালে প্রথম রক্ত দিতে হয়।
                      এরপর স্বাভাবিক নাস্তা করার প্রথম লোকমা নেওয়ার ঠিক ২ ঘণ্টা পর ২য় বার রক্ত দিতে হবে।
                    </Text>
                  </View>
                </View>

                <View style={styles.prepCard}>
                  <MaterialIcons name="healing" size={20} color="#8B5CF6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prepTitle}>৩. থাইরয়েড টেস্ট (TSH, FT4, T3)</Text>
                    <Text style={styles.prepBody}>
                      যাঁরা নিয়মিত থাইরয়েডের ওষুধ (যেমন: Thyrox / Eltroxin) খান, তাঁরা রক্ত দেওয়ার
                      পূর্বে সকালের ওষুধ খাবেন না। রক্ত দেওয়ার পর ওষুধ সেবন করবেন।
                    </Text>
                  </View>
                </View>

                <View style={styles.prepCard}>
                  <MaterialIcons name="camera-alt" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prepTitle}>৪. পেটের আল্ট্রাসনোগ্রাম (USG of Abdomen)</Text>
                    <Text style={styles.prepBody}>
                      হোল এবডোমেন স্ক্যানের জন্য ৬ ঘণ্টা না খেয়ে যেতে হবে। এছাড়া মূত্রথলি ও জরায়ু
                      পরিষ্কার দেখতে টেস্টের ১ ঘণ্টা আগে ১ লিটার পানি পান করে প্রস্রাবের পর্যাপ্ত চাপ
                      রাখতে হবে।
                    </Text>
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
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
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
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284C7',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#0284C7',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: C.onSurface,
    fontFamily: F.regular,
    fontSize: 12,
  },
  catPillScroll: {
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284C7',
  },
  catPillText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  catPillTextActive: {
    fontFamily: F.bold,
    color: '#0284C7',
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  basketQuickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  basketQuickLinkText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#0284C7',
  },
  testCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  testCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testNameBn: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  testCodeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  testCodeBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#0284C7',
  },
  testNameEn: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  testDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 3,
    lineHeight: 14,
  },
  basketAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  basketAddBtnActive: {
    backgroundColor: '#0284C7',
  },
  basketAddBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#0284C7',
  },
  basketAddBtnTextActive: {
    color: '#FFFFFF',
  },
  fastingAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 6,
    borderRadius: 6,
  },
  fastingAlertText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: '#F59E0B',
    flex: 1,
    lineHeight: 13,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 10,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  centerTag: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  centerPrice: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurface,
  },
  bestValueHero: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestValueTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#10B981',
  },
  bestValueSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyEstimateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  copyEstimateText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  waEstimateBtn: {
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
  waEstimateText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
  selectedSection: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  selectedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedTagText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  centerBillCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  centerBillCardCheapest: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  centerBillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  centerNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  centerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerNameBn: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  bestBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontFamily: F.bold,
    fontSize: 7,
    color: '#FFFFFF',
  },
  centerSubText: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  centerPriceCol: {
    alignItems: 'flex-end',
  },
  centerTotalAmount: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  centerSavingsText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#10B981',
    marginTop: 1,
  },
  centerCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  centerDiscountNote: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  callHotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callHotlineText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#0284C7',
  },
  emptyBasketWrap: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyBasketTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  emptyBasketSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  startSearchBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  startSearchBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  homeHeroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  homeHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#10B981',
  },
  homeHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  homeCenterCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  homeCenterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  homeCenterName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  homeCenterSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  homeFeeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  homeFeeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#0284C7',
  },
  homeDiscount: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
  },
  directCallBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directCallText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  prepCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  prepTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  prepBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 16,
  },
});
