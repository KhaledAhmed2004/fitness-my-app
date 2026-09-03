import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useEmergencyHotlineStore } from '@/stores/emergency-hotline-store';
import {
  DivisionCity,
  EmergencyCategory,
  EmergencyContactItem,
} from '@/types/emergency-hotline';

const C = Vital.colors;
const F = Vital.fonts;

interface EmergencyHotlineModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: EmergencyCategory;
}

const CITY_OPTIONS: Array<{ id: DivisionCity; labelBn: string; labelEn: string }> = [
  { id: 'ALL_BD', labelBn: 'সারাদেশ', labelEn: 'All BD' },
  { id: 'DHAKA', labelBn: 'ঢাকা', labelEn: 'Dhaka' },
  { id: 'CHITTAGONG', labelBn: 'চট্টগ্রাম', labelEn: 'Chittagong' },
  { id: 'SYLHET', labelBn: 'সিলেট', labelEn: 'Sylhet' },
  { id: 'RAJSHAHI', labelBn: 'রাজশাহী', labelEn: 'Rajshahi' },
  { id: 'KHULNA', labelBn: 'খুলনা', labelEn: 'Khulna' },
  { id: 'BARISAL', labelBn: 'বরিশাল', labelEn: 'Barisal' },
  { id: 'RANGPUR', labelBn: 'রংপুর', labelEn: 'Rangpur' },
];

const CATEGORY_TABS: Array<{
  id: EmergencyCategory;
  labelBn: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}> = [
  { id: 'ALL', labelBn: 'সকল সেবা', icon: 'apps', color: '#38BDF8' },
  { id: 'AMBULANCE_ICU', labelBn: '🚨 অ্যাম্বুলেন্স & ICU', icon: 'local-hospital', color: '#EF4444' },
  { id: 'PHARMACY_24_7', labelBn: '💊 ২৪/৭ ফার্মেসি', icon: 'medication', color: '#10B981' },
  { id: 'OXYGEN_CYLINDER', labelBn: '💨 অক্সিজেন সিলিন্ডার', icon: 'air', color: '#00B4D8' },
  { id: 'BLOOD_BANK', labelBn: '🩸 ব্লাড ব্যাংক', icon: 'water-drop', color: '#F43F5E' },
  { id: 'NATIONAL_GOVT', labelBn: '📞 জাতীয় হেল্পলাইন', icon: 'phone-in-talk', color: '#F59E0B' },
  { id: 'CUSTOM_SAVED', labelBn: '⭐ নিজস্ব নম্বর', icon: 'bookmark', color: '#8B5CF6' },
];

export function EmergencyHotlineModal({
  visible,
  onClose,
  initialCategory = 'ALL',
}: EmergencyHotlineModalProps) {
  const selectedCity = useEmergencyHotlineStore((s) => s.selectedCity);
  const setSelectedCity = useEmergencyHotlineStore((s) => s.setSelectedCity);
  const selectedCategory = useEmergencyHotlineStore((s) => s.selectedCategory);
  const setSelectedCategory = useEmergencyHotlineStore((s) => s.setSelectedCategory);
  const customContacts = useEmergencyHotlineStore((s) => s.customContacts);
  const addCustomContact = useEmergencyHotlineStore((s) => s.addCustomContact);
  const deleteCustomContact = useEmergencyHotlineStore((s) => s.deleteCustomContact);
  const logRecentCall = useEmergencyHotlineStore((s) => s.logRecentCall);
  const getAllContacts = useEmergencyHotlineStore((s) => s.getAllContacts);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Live Location
  const [currentGps, setCurrentGps] = useState<{
    lat: number;
    lng: number;
    text: string;
  }>({
    lat: 23.8103,
    lng: 90.4125,
    text: 'Dhaka, Bangladesh',
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // New Custom Contact Form State
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customWa, setCustomWa] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [customCat, setCustomCat] = useState<EmergencyCategory>('AMBULANCE_ICU');
  const [customCity, setCustomCity] = useState<DivisionCity>('DHAKA');
  const [customIs24x7, setCustomIs24x7] = useState(true);

  // Acquire GPS on mount
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    (async () => {
      try {
        setGpsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted) {
            setCurrentGps({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              text: `${loc.coords.latitude.toFixed(4)}° N, ${loc.coords.longitude.toFixed(4)}° E`,
            });
          }
        }
      } catch {
        // keep fallback
      } finally {
        if (isMounted) setGpsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Sync initialCategory
  useEffect(() => {
    if (initialCategory && initialCategory !== 'ALL') {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, setSelectedCategory]);

  const allContacts = useMemo(() => getAllContacts(), [getAllContacts, customContacts]);

  // Filtered List
  const filteredContacts = useMemo(() => {
    return allContacts.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL') {
        if (item.category !== selectedCategory) return false;
      }

      // 2. City Filter (National/All_BD always passes)
      if (selectedCity !== 'ALL_BD') {
        if (item.city !== 'ALL_BD' && item.city !== selectedCity) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName =
          item.name.toLowerCase().includes(q) ||
          item.nameBn.toLowerCase().includes(q);
        const matchArea = item.areaDescriptionBn.toLowerCase().includes(q);
        const matchPhone =
          item.primaryPhone.includes(q) ||
          (item.alternatePhone && item.alternatePhone.includes(q));
        const matchServices = item.servicesProvidedBn.some((s) =>
          s.toLowerCase().includes(q)
        );
        return matchName || matchArea || matchPhone || matchServices;
      }

      return true;
    });
  }, [allContacts, selectedCategory, selectedCity, searchQuery]);

  // Direct Call Handler
  const handleCall = (phone: string, id: string, name: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    logRecentCall(id);
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    void Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('কল ব্যর্থ হয়েছে', `নম্বর: ${phone}`);
    });
  };

  // WhatsApp Dispatch with Live GPS
  const handleWhatsApp = (item: EmergencyContactItem) => {
    const wa = item.whatsappPhone || item.primaryPhone;
    const cleanWa = wa.replace(/[^0-9]/g, '');
    const locationMapUrl = `https://maps.google.com/?q=${currentGps.lat},${currentGps.lng}`;
    const msg = `🚨 জরুরি চিকিৎসা সহায়তা প্রয়োজন!\n\n📍 আমার লাইভ লোকেশন: ${locationMapUrl}\nস্থানাঙ্ক: (${currentGps.text})\n\nদয়া করে দ্রুত যোগাযোগ ও সহায়তা পাঠান।`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    const waUrl = `whatsapp://send?phone=${cleanWa}&text=${encodeURIComponent(msg)}`;
    void Linking.openURL(waUrl).catch(() => {
      void Linking.openURL(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`).catch(() => {
        Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'আপনার ফোনে WhatsApp ইনস্টল করা আছে কিনা চেক করুন।');
      });
    });
  };

  // Copy Number
  const handleCopy = async (phone: string, label: string) => {
    await Clipboard.setStringAsync(phone);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopiedToast(`"${label}" নম্বরটি (${phone}) কপি করা হয়েছে!`);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // Share Live GPS
  const handleCopyGpsLocation = async () => {
    const mapUrl = `https://maps.google.com/?q=${currentGps.lat},${currentGps.lng}`;
    const text = `🚨 আমার লাইভ লোকেশন:\n${mapUrl}\nস্থানাঙ্ক: ${currentGps.text}`;
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopiedToast('লাইভ লোকেশন ম্যাপ লিংক কপি করা হয়েছে!');
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // Save Custom Contact
  const handleSaveCustom = () => {
    if (!customName.trim() || !customPhone.trim()) {
      Alert.alert('অপূর্ণ তথ্য', 'দয়া করে নাম ও ফোন নম্বর পূরণ করুন।');
      return;
    }

    addCustomContact({
      name: customName.trim(),
      nameBn: customName.trim(),
      category: customCat,
      city: customCity,
      areaDescriptionBn: customArea.trim() || 'ব্যক্তিগত সংরক্ষিত জরুরি নম্বর',
      primaryPhone: customPhone.trim(),
      whatsappPhone: customWa.trim() || undefined,
      is24x7: customIs24x7,
      isGovernment: false,
      servicesProvidedBn: ['ব্যক্তিগত হেল্পলাইন'],
      badgeColor: '#8B5CF6',
    });

    setCustomName('');
    setCustomPhone('');
    setCustomWa('');
    setCustomArea('');
    setIsAddFormOpen(false);
    setSelectedCategory('CUSTOM_SAVED');

    Alert.alert('নম্বর সংরক্ষিত হয়েছে! 🎉', 'জরুরি নম্বরটি সফলভাবে আপনার তালিকায় যোগ হয়েছে।');
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
                <MaterialIcons name="emergency" size={24} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Emergency Ambulance & Hotlines
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  জরুরি অ্যাম্বুলেন্স, আইসিইউ, অক্সিজেন ও ২৪/৭ ফার্মেসি
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.addCustomHeaderBtn}
                onPress={() => setIsAddFormOpen(!isAddFormOpen)}>
                <MaterialIcons name="person-add" size={16} color="#38BDF8" />
                <Text style={styles.addCustomHeaderText}>নম্বর যোগ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onClose();
                }}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Live GPS Hero Bar */}
          <View style={styles.gpsHeroBar}>
            <View style={styles.gpsLeft}>
              <MaterialIcons name="my-location" size={16} color="#00B4D8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsLabel}>বর্তমান লাইভ জিপিএস লোকেশন:</Text>
                <Text style={styles.gpsCoords} numberOfLines={1}>
                  {gpsLoading ? 'জিপিএস লোড হচ্ছে...' : currentGps.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.gpsCopyBtn}
              onPress={handleCopyGpsLocation}>
              <MaterialIcons name="share-location" size={14} color="#000" />
              <Text style={styles.gpsCopyBtnText}>লোকেশন কপি</Text>
            </TouchableOpacity>
          </View>

          {/* National Big 3 Quick-Dial Hero Row */}
          <View style={styles.bigThreeSection}>
            <TouchableOpacity
              style={[styles.bigCallCard, { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
              onPress={() => handleCall('999', 'emg_999', 'National 999')}>
              <View style={[styles.bigCallIconBox, { backgroundColor: '#EF4444' }]}>
                <MaterialIcons name="phone" size={18} color="#FFF" />
              </View>
              <Text style={[styles.bigCallNumber, { color: '#EF4444' }]}>৯৯৯</Text>
              <Text style={styles.bigCallTitle}>জাতীয় জরুরি সেবা</Text>
              <Text style={styles.bigCallSub}>পুলিশ • অ্যাম্বুলেন্স • ফায়ার</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bigCallCard, { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
              onPress={() => handleCall('16263', 'emg_16263', 'Shastho Batayon')}>
              <View style={[styles.bigCallIconBox, { backgroundColor: '#10B981' }]}>
                <MaterialIcons name="medical-services" size={18} color="#FFF" />
              </View>
              <Text style={[styles.bigCallNumber, { color: '#10B981' }]}>১৬২৬৩</Text>
              <Text style={styles.bigCallTitle}>স্বাস্থ্য বাতায়ন</Text>
              <Text style={styles.bigCallSub}>২৪/৭ সরকারি ডাক্তার</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bigCallCard, { borderColor: 'rgba(59, 130, 246, 0.4)', backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}
              onPress={() => handleCall('333', 'emg_333', 'National 333')}>
              <View style={[styles.bigCallIconBox, { backgroundColor: '#3B82F6' }]}>
                <MaterialIcons name="account-balance" size={18} color="#FFF" />
              </View>
              <Text style={[styles.bigCallNumber, { color: '#3B82F6' }]}>৩৩৩</Text>
              <Text style={styles.bigCallTitle}>নাগরিক সেবা</Text>
              <Text style={styles.bigCallSub}>সরকারি তথ্য ও জরুরি ত্রাণ</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputWrap}>
              <MaterialIcons name="search" size={20} color="#38BDF8" />
              <TextInput
                style={styles.searchInput}
                placeholder="হাসপাতাল, অ্যাম্বুলেন্স, অক্সিজেন বা ফার্মেসির নাম খুঁজুন..."
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

          {/* Division City Chips Filter */}
          <View style={styles.cityChipsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityChipsScroll}>
              {CITY_OPTIONS.map((city) => {
                const isSelected = selectedCity === city.id;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityChip,
                      isSelected && styles.cityChipSelected,
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setSelectedCity(city.id);
                    }}>
                    <Text
                      style={[
                        styles.cityChipText,
                        isSelected && styles.cityChipTextSelected,
                      ]}>
                      📍 {city.labelBn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category Tabs Scroll */}
          <View style={styles.categoryTabsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsScroll}>
              {CATEGORY_TABS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catTab,
                      isSelected && {
                        backgroundColor: `${cat.color}20`,
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setSelectedCategory(cat.id);
                    }}>
                    <MaterialIcons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? cat.color : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.catTabText,
                        isSelected && { color: cat.color, fontFamily: F.bold },
                      ]}>
                      {cat.labelBn}
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
              <Text style={styles.toastBannerText}>{copiedToast}</Text>
            </View>
          )}

          {/* Main Content Area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
            showsVerticalScrollIndicator={false}>
            {/* Custom Contact Form Sheet (Collapsible) */}
            {isAddFormOpen && (
              <View style={styles.addFormContainer}>
                <View style={styles.addFormHeader}>
                  <MaterialIcons name="add-circle" size={18} color="#38BDF8" />
                  <Text style={styles.addFormTitle}>
                    পারিবারিক বা স্থানীয় জরুরি নম্বর সংরক্ষণ
                  </Text>
                </View>

                <View style={styles.formGrid}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="নাম (যেমন: পাড়ার বিশ্বস্ত অ্যাম্বুলেন্স / ডাক্তার)"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={customName}
                    onChangeText={setCustomName}
                  />

                  <View style={styles.formRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      placeholder="ফোন নম্বর (যেমন: 01711xxxxxx)"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="phone-pad"
                      value={customPhone}
                      onChangeText={setCustomPhone}
                    />
                    <TextInput
                      style={[styles.formInput, { flex: 1, marginLeft: 8 }]}
                      placeholder="হোয়াটসঅ্যাপ (ঐচ্ছিক)"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="phone-pad"
                      value={customWa}
                      onChangeText={setCustomWa}
                    />
                  </View>

                  <TextInput
                    style={styles.formInput}
                    placeholder="এলাকা বা ঠিকানা (যেমন: মিরপুর-১০, ঢাকা)"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={customArea}
                    onChangeText={setCustomArea}
                  />

                  <View style={styles.formActionsRow}>
                    <TouchableOpacity
                      style={styles.formCancelBtn}
                      onPress={() => setIsAddFormOpen(false)}>
                      <Text style={styles.formCancelBtnText}>বাতিল</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formSaveBtn}
                      onPress={handleSaveCustom}>
                      <Text style={styles.formSaveBtnText}>সংরক্ষণ করুন</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Contacts List */}
            <View style={styles.contactsList}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>
                  উপলব্ধ জরুরি সেবাসমূহ ({filteredContacts.length})
                </Text>
              </View>

              {filteredContacts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialIcons name="search-off" size={36} color={C.onSurfaceVariant} />
                  <Text style={styles.emptyText}>
                    কোনো জরুরি সেবা পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন বা নতুন নম্বর যোগ করুন।
                  </Text>
                </View>
              ) : (
                filteredContacts.map((contact) => {
                  const badgeColor = contact.badgeColor || '#38BDF8';
                  return (
                    <View key={contact.id} style={styles.contactCard}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardTitleWrap}>
                          <View style={styles.cardNameRow}>
                            <Text style={styles.cardNameText}>{contact.nameBn}</Text>
                            {contact.isVerified && (
                              <MaterialIcons name="verified" size={15} color="#38BDF8" />
                            )}
                          </View>
                          <Text style={styles.cardEnglishName}>{contact.name}</Text>
                        </View>

                        {/* 24/7 or Govt Badge */}
                        <View style={styles.topRightBadges}>
                          {contact.is24x7 && (
                            <View style={styles.open24Badge}>
                              <Text style={styles.open24Text}>২৪ ঘণ্টা</Text>
                            </View>
                          )}
                          {contact.isGovernment && (
                            <View style={styles.govtBadge}>
                              <Text style={styles.govtText}>সরকারি</Text>
                            </View>
                          )}
                          {contact.isCustom && (
                            <TouchableOpacity
                              onPress={() => deleteCustomContact(contact.id)}
                              style={styles.deleteCustomBtn}>
                              <MaterialIcons name="delete-outline" size={16} color="#FF6B6B" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Area & Services */}
                      <Text style={styles.areaDescText}>
                        📍 {contact.areaDescriptionBn}
                      </Text>

                      {contact.servicesProvidedBn.length > 0 && (
                        <View style={styles.servicesRow}>
                          {contact.servicesProvidedBn.map((svc, i) => (
                            <View key={i} style={styles.serviceChip}>
                              <Text style={styles.serviceChipText}>✓ {svc}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Phone & Action Buttons */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.callMainBtn}
                          onPress={() => handleCall(contact.primaryPhone, contact.id, contact.name)}>
                          <MaterialIcons name="phone" size={16} color="#000" />
                          <Text style={styles.callMainBtnText}>
                            কল: {contact.primaryPhone}
                          </Text>
                        </TouchableOpacity>

                        {/* WhatsApp Dispatch */}
                        <TouchableOpacity
                          style={styles.waBtn}
                          onPress={() => handleWhatsApp(contact)}>
                          <MaterialIcons name="chat" size={16} color="#25D366" />
                          <Text style={styles.waBtnText}>GPS মেসেজ</Text>
                        </TouchableOpacity>

                        {/* Copy */}
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopy(contact.primaryPhone, contact.nameBn)}>
                          <MaterialIcons name="content-copy" size={15} color={C.onSurfaceVariant} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    color: '#EF4444',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCustomHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addCustomHeaderText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  gpsHeroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
  },
  gpsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  gpsLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#00B4D8',
  },
  gpsCoords: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  gpsCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B4D8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  gpsCopyBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#000',
  },
  bigThreeSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  bigCallCard: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  bigCallIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bigCallNumber: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  bigCallTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
    textAlign: 'center',
  },
  bigCallSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
  cityChipsWrap: {
    paddingVertical: 6,
  },
  cityChipsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cityChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  cityChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  cityChipTextSelected: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  categoryTabsWrap: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTabsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 5,
  },
  catTabText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(81, 207, 102, 0.3)',
  },
  toastBannerText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#51CF66',
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  addFormContainer: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 10,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addFormTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  formGrid: {
    gap: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.onSurface,
    fontFamily: F.medium,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formRow: {
    flexDirection: 'row',
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  formCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  formCancelBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  formSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
  },
  formSaveBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#000',
  },
  contactsList: {
    gap: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  contactCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardNameText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  cardEnglishName: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  topRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  open24Badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  open24Text: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#10B981',
  },
  govtBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  govtText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#3B82F6',
  },
  deleteCustomBtn: {
    padding: 4,
  },
  areaDescText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  serviceChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  callMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  callMainBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFF',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    gap: 4,
  },
  waBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
  copyBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    gap: 8,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});
