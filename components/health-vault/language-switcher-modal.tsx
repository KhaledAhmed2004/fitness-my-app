import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLanguageStore } from '@/stores/language-store';
import { LanguageCode, LanguageInfo } from '@/types/language';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface LanguageSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSwitcherModal({
  visible,
  onClose,
}: LanguageSwitcherModalProps) {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const supportedLanguages = useLanguageStore((s) => s.supportedLanguages);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = useLanguageStore((s) => s.t);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = supportedLanguages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (code: LanguageCode) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    await setLanguage(code);
    onClose();
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
                <MaterialIcons name="translate" size={20} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t('select_language', 'Select Language')}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {t('language_subtitle', 'Switch UI, prescriptions & medical card language')}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={18} color={C.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search English, বাংলা, Español, العربية..."
                placeholderTextColor={C.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="cancel" size={16} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Language Options List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}>
            {filteredLanguages.map((lang: LanguageInfo) => {
              const isSelected = currentLanguage === lang.code;

              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.82}
                  onPress={() => handleSelect(lang.code)}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardActive,
                  ]}>
                  <View style={styles.flagBox}>
                    <Text style={styles.flagText}>{lang.flag}</Text>
                  </View>

                  <View style={styles.langInfo}>
                    <Text
                      style={[
                        styles.nativeName,
                        isSelected && styles.nativeNameActive,
                      ]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.regionText}>
                      {lang.name} • {lang.region}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}>
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color="#101416" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: '#FFFFFF',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  langCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: '#38BDF8',
  },
  flagBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#13191C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 22,
  },
  langInfo: {
    flex: 1,
  },
  nativeName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  nativeNameActive: {
    color: '#38BDF8',
  },
  regionText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
});
