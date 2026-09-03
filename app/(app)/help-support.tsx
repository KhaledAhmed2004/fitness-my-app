import React, { useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { FAQ_CATEGORIES, FAQ_ITEMS } from '@/constants/faq-data';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';

const C = Vital.colors;
const F = Vital.fonts;

const ISSUE_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'bug-report' },
  { id: 'feature', label: 'Feature Request', icon: 'lightbulb' },
  { id: 'feedback', label: 'Feedback', icon: 'rate-review' },
  { id: 'account', label: 'Account Help', icon: 'manage-accounts' },
];

export default function HelpSupportScreen() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  // Contact / Bug Report Modal State
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState('bug');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Info Modals (Privacy, Changelog, Community)
  const [infoModalContent, setInfoModalContent] = useState<{
    visible: boolean;
    icon: any;
    iconColor: string;
    title: string;
    badge: string;
    body: string[];
  }>({
    visible: false,
    icon: 'info',
    iconColor: '#89CEFF',
    title: '',
    badge: '',
    body: [],
  });

  // Filter FAQs based on category and search query
  const filteredFAQs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const inQuestion = item.question.toLowerCase().includes(query);
      const inAnswer = item.answer.toLowerCase().includes(query);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(query));

      return inQuestion || inAnswer || inTags;
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOpenContact = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setContactModalVisible(true);
  };

  const handleShareApp = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    try {
      await Share.share({
        title: 'TrackMe — Health, Nutrition & Biohacking',
        message:
          "🚀 I'm optimizing my daily health, fasting & workout routines with TrackMe! Join me: https://vitalapp.io/download",
        url: 'https://vitalapp.io/download',
      });
    } catch {
      /* cancelled */
    }
  };

  const openInfoModal = (content: {
    icon: any;
    iconColor: string;
    title: string;
    badge: string;
    body: string[];
  }) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setInfoModalContent({ ...content, visible: true });
  };

  const handleSendTicket = async () => {
    if (!ticketMessage.trim()) {
      Alert.alert('Message Required', 'Please enter a description of your issue or request.');
      return;
    }

    setIsSubmitting(true);

    const diagnostics = `\n\n--- System Diagnostics ---\nUser: ${user?.email ?? 'Anonymous'}\nOS: ${Platform.OS} ${Platform.Version}\nApp: TrackMe v1.0.0 (Build 2026.08)\nCategory: ${selectedIssueType.toUpperCase()}`;
    const fullBody = `${ticketMessage.trim()}${diagnostics}`;
    const subject = ticketSubject.trim() || `[TrackMe Support] ${selectedIssueType.toUpperCase()} Report`;

    const mailUrl = `mailto:support@vitalapp.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
      }
    } catch {
      // Fallback in-app confirmation
    } finally {
      setIsSubmitting(false);
      setContactModalVisible(false);
      setTicketMessage('');
      setTicketSubject('');
      setShowSuccessToast(true);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

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

        <Text style={styles.appBarTitle}>Help & Support</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenContact}
          style={styles.contactHeaderBtn}>
          <MaterialIcons name="mail-outline" size={16} color="#89CEFF" />
          <Text style={styles.contactHeaderBtnText}>Contact</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIconWrap}>
              <MaterialIcons name="contact-support" size={20} color="#89CEFF" />
            </View>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroTitle}>Help Center</Text>
              <Text style={styles.heroSubtitle}>
                Guides, FAQs & Support
              </Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Search our knowledge base, explore feature tutorials, or report any issue to our product team.
          </Text>

          {/* SEARCH INPUT */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={C.onSurfaceVariant} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search guides, macros, fasting..."
              placeholderTextColor={C.outline}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* TOAST FEEDBACK NOTIFICATIONS */}
        {showSuccessToast ? (
          <View style={styles.toastContainer}>
            <MaterialIcons name="check-circle" size={18} color="#89FE00" />
            <Text style={styles.toastText}>Support ticket dispatched! We will reply via email shortly.</Text>
          </View>
        ) : null}

        {/* CATEGORY CHIPS */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionHeader}>CATEGORIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}>
            {FAQ_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    setSelectedCategory(cat.id);
                  }}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}>
                  <MaterialIcons
                    name={cat.icon as any}
                    size={15}
                    color={isSelected ? '#002538' : C.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* FAQ ACCORDION LIST */}
        <View style={styles.faqSection}>
          <View style={styles.faqSectionHeaderRow}>
            <Text style={styles.sectionHeader}>
              FREQUENTLY ASKED QUESTIONS ({filteredFAQs.length})
            </Text>
          </View>

          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <MaterialIcons name="search-off" size={32} color={C.outline} />
              <Text style={styles.emptyStateTitle}>No matching articles found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try searching with different keywords or submit a question directly.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenContact}
                style={styles.emptyStateBtn}>
                <Text style={styles.emptyStateBtnText}>Ask Our Support Team</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.faqCardsContainer}>
              {filteredFAQs.map((faq, index) => {
                const isExpanded = expandedId === faq.id;
                const isLast = index === filteredFAQs.length - 1;

                return (
                  <View
                    key={faq.id}
                    style={[
                      styles.faqCard,
                      !isLast && styles.faqCardBorder,
                    ]}>
                    <Pressable
                      onPress={() => toggleAccordion(faq.id)}
                      style={styles.faqQuestionRow}>
                      <Text
                        style={[
                          styles.faqQuestionText,
                          isExpanded && { color: '#89CEFF' },
                        ]}>
                        {faq.question}
                      </Text>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={isExpanded ? '#89CEFF' : C.outline}
                      />
                    </Pressable>

                    {isExpanded ? (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>

                        {faq.tips && faq.tips.length > 0 ? (
                          <View style={styles.faqTipBox}>
                            <View style={styles.faqTipHeader}>
                              <MaterialIcons name="tips-and-updates" size={16} color="#FCC419" />
                              <Text style={styles.faqTipTitle}>PRO TIP</Text>
                            </View>
                            {faq.tips.map((tip, idx) => (
                              <Text key={idx} style={styles.faqTipContent}>
                                • {tip}
                              </Text>
                            ))}
                          </View>
                        ) : null}

                        {/* Tag Pills */}
                        <View style={styles.faqTagsRow}>
                          {faq.tags.map((tag) => (
                            <View key={tag} style={styles.faqTagPill}>
                              <Text style={styles.faqTagText}>#{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* STILL HAVE QUESTIONS FOOTER CALLOUT */}
        <View style={styles.stillNeedHelpCard}>
          <View style={styles.stillNeedHelpHeader}>
            <View style={styles.stillNeedHelpIconWrap}>
              <MaterialIcons name="forum" size={22} color="#89CEFF" />
            </View>
            <View style={styles.stillNeedHelpTextGroup}>
              <Text style={styles.stillNeedHelpTitle}>Still have questions?</Text>
              <Text style={styles.stillNeedHelpSubtitle}>
                Can&apos;t find the answer you&apos;re looking for? Our product team is ready to assist you.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenContact}
            style={styles.stillNeedHelpBtn}>
            <MaterialIcons name="send" size={16} color="#002538" />
            <Text style={styles.stillNeedHelpBtnText}>Ask a Question / Contact Team</Text>
          </TouchableOpacity>
        </View>

        {/* REFINED QUICK RESOURCES & LEGAL COMPLIANCE */}
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionHeader}>COMMUNITY, LEGAL & ASSISTANCE</Text>

          <View style={styles.resourceCardGroup}>
            {/* COMMUNITY & DISCUSSIONS */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'people-alt',
                  iconColor: '#A78BFA',
                  title: 'Community & Discussions',
                  badge: 'GLOBAL NETWORK',
                  body: [
                    'Join thousands of athletes, biohackers, and productivity enthusiasts on the official TrackMe Community.',
                    '• Share healthy recipes & macro meal templates.',
                    '• Join monthly intermittent fasting challenges.',
                    '• Connect with runners in your local area.',
                    'Official Community Discord: discord.gg/vitaltrackme',
                  ],
                })
              }
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                <MaterialIcons name="people-alt" size={20} color="#A78BFA" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Community & Discussions</Text>
                <Text style={styles.resourceSubtitle}>Connect with other members & share tips</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>

            {/* WHAT'S NEW / CHANGELOG */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'auto-awesome',
                  iconColor: '#FCC419',
                  title: "What's New in v1.0.0",
                  badge: 'RELEASE NOTES',
                  body: [
                    '🌟 Modular Feature Toggles: Turn on/off any of the 8 core features to customize your dashboard.',
                    '⏳ Enhanced Fasting Tracker: Real-time metabolic stage tracking (Ketosis & Autophagy).',
                    '🎯 Deep Focus Pomodoro: Ultra-radian rhythm blocks with built-in rest periods.',
                    '🔒 Hardware-backed Encryption: Upgraded local SQLite database protection with SecureStore.',
                  ],
                })
              }
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
                <MaterialIcons name="auto-awesome" size={20} color="#FCC419" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>What&apos;s New in v1.0</Text>
                <Text style={styles.resourceSubtitle}>Explore recent features, fixes & improvements</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>

            {/* PRIVACY POLICY & TERMS */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'policy',
                  iconColor: '#20C997',
                  title: 'Privacy Policy & Terms',
                  badge: 'LOCAL-FIRST ENCRYPTION',
                  body: [
                    'Your health, financial, and routine data is strictly private and stored on your device with hardware-backed encryption.',
                    '• Zero data selling: We do not sell or monetize personal telemetry.',
                    '• Offline-first architecture: All timers, logs, and stats work seamlessly without internet.',
                    '• Data ownership: You can export your full records at any time from your account.',
                  ],
                })
              }
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                <MaterialIcons name="policy" size={20} color="#20C997" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Privacy Policy & Terms</Text>
                <Text style={styles.resourceSubtitle}>Local-first data governance & GDPR compliance</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>

            {/* REPORT BUG / FEATURE REQUEST */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenContact}
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                <MaterialIcons name="bug-report" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Report an Issue / Suggestion</Text>
                <Text style={styles.resourceSubtitle}>Send feedback directly with device diagnostics</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>

            {/* SHARE TRACKME */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShareApp}
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(255, 107, 139, 0.15)' }]}>
                <MaterialIcons name="card-giftcard" size={20} color="#FF6B8B" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Share TrackMe with Friends</Text>
                <Text style={styles.resourceSubtitle}>Invite friends & spread wellness routines</Text>
              </View>
              <MaterialIcons name="share" size={18} color={C.outline} />
            </TouchableOpacity>

            {/* RATE TRACKME */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'star',
                  iconColor: '#FCC419',
                  title: 'Rate TrackMe on Store',
                  badge: '5-STAR APPRECIATION',
                  body: [
                    'We love hearing your stories and feedback!',
                    '• Your 5-star ratings help other athletes, biohackers, and health enthusiasts discover TrackMe.',
                    '• Every review directly funds new feature development and local-first encryption updates.',
                  ],
                })
              }
              style={[styles.resourceRow, styles.resourceRowBorder]}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
                <MaterialIcons name="star-rate" size={20} color="#FCC419" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Rate TrackMe (5.0 ★)</Text>
                <Text style={styles.resourceSubtitle}>Support our indie engineering journey</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>

            {/* DIRECT EMAIL */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:support@vitalapp.io')}
              style={styles.resourceRow}>
              <View style={[styles.resourceIconBadge, { backgroundColor: 'rgba(137, 206, 255, 0.15)' }]}>
                <MaterialIcons name="alternate-email" size={20} color="#89CEFF" />
              </View>
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Email Support Desk</Text>
                <Text style={styles.resourceSubtitle}>support@vitalapp.io</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* REUSABLE INFO MODAL (COMMUNITY / CHANGELOG / PRIVACY) */}
      <Modal
        visible={infoModalContent.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalContent((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setInfoModalContent((prev) => ({ ...prev, visible: false }))}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: infoModalContent.iconColor + '20' }]}>
                  <MaterialIcons name={infoModalContent.icon} size={22} color={infoModalContent.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{infoModalContent.title}</Text>
                  <Text style={[styles.infoModalBadge, { color: infoModalContent.iconColor }]}>
                    {infoModalContent.badge}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setInfoModalContent((prev) => ({ ...prev, visible: false }))}
                hitSlop={10}
                style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
              {infoModalContent.body.map((paragraph, idx) => (
                <Text key={idx} style={styles.infoModalParagraph}>
                  {paragraph}
                </Text>
              ))}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setInfoModalContent((prev) => ({ ...prev, visible: false }))}
              style={styles.modalPrimaryBtn}>
              <Text style={styles.modalPrimaryBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACT & BUG REPORT MODAL */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setContactModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconCircle}>
                  <MaterialIcons name="support-agent" size={22} color="#89CEFF" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Contact Support</Text>
                  <Text style={styles.modalSubtitle}>We usually respond within 24 hours</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setContactModalVisible(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* ISSUE TYPE SELECTOR */}
            <Text style={styles.inputLabel}>ISSUE TYPE</Text>
            <View style={styles.issueTypeGrid}>
              {ISSUE_TYPES.map((type) => {
                const isSelected = selectedIssueType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedIssueType(type.id)}
                    style={[
                      styles.issueTypeBtn,
                      isSelected && styles.issueTypeBtnActive,
                    ]}>
                    <MaterialIcons
                      name={type.icon as any}
                      size={16}
                      color={isSelected ? '#002538' : '#89CEFF'}
                    />
                    <Text
                      style={[
                        styles.issueTypeBtnText,
                        isSelected && styles.issueTypeBtnTextActive,
                      ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SUBJECT */}
            <Text style={styles.inputLabel}>SUBJECT (OPTIONAL)</Text>
            <TextInput
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="e.g. Sync issue on fast completion"
              placeholderTextColor={C.outline}
              style={styles.modalTextInput}
            />

            {/* DESCRIPTION TEXTAREA */}
            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              value={ticketMessage}
              onChangeText={setTicketMessage}
              placeholder="Please describe what happened or what feature you would love to see..."
              placeholderTextColor={C.outline}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.modalTextArea}
            />

            {/* TELEMETRY NOTICE */}
            <View style={styles.diagNotice}>
              <MaterialIcons name="verified-user" size={14} color="#89CEFF" />
              <Text style={styles.diagNoticeText}>
                Device diagnostics (OS: {Platform.OS}, v1.0.0) will be automatically attached to help resolve your issue faster.
              </Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendTicket}
                disabled={isSubmitting}
                style={styles.modalPrimaryBtn}>
                <MaterialIcons name="send" size={18} color="#002538" />
                <Text style={styles.modalPrimaryBtnText}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setContactModalVisible(false)}
                style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
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
  contactHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    gap: 5,
  },
  contactHeaderBtnText: {
    color: '#89CEFF',
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  heroCard: {
    marginBottom: 20,
    padding: 18,
    borderRadius: Vital.radius.xxl,
    backgroundColor: C.surfaceContainer,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconWrap: {
    height: 38,
    width: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleGroup: {
    flex: 1,
  },
  heroTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 1,
  },
  heroDescription: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 12,
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sans,
    paddingVertical: 0,
    height: '100%',
  },
  toastContainer: {
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
  sectionHeader: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryChipsScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.surfaceContainer,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#89CEFF',
  },
  categoryChipText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  categoryChipTextActive: {
    color: '#002538',
    fontFamily: F.sansBold,
  },
  faqSection: {
    marginBottom: 20,
  },
  faqSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqCardsContainer: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    overflow: 'hidden',
  },
  faqCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 8,
  },
  faqAnswerText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    lineHeight: 19,
  },
  faqTipBox: {
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  faqTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  faqTipTitle: {
    color: '#FCC419',
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  faqTipContent: {
    color: '#E0E3E6',
    fontSize: 12,
    fontFamily: F.sans,
    lineHeight: 16,
    marginTop: 2,
  },
  faqTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  faqTagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  faqTagText: {
    color: C.outline,
    fontSize: 10,
    fontFamily: F.mono,
  },
  emptyStateCard: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 10,
  },
  emptyStateSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  emptyStateBtn: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
  },
  emptyStateBtnText: {
    color: '#89CEFF',
    fontSize: 12,
    fontFamily: F.sansBold,
  },

  /* STILL NEED HELP CARD */
  stillNeedHelpCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    gap: 14,
  },
  stillNeedHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stillNeedHelpIconWrap: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stillNeedHelpTextGroup: {
    flex: 1,
  },
  stillNeedHelpTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  stillNeedHelpSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
    lineHeight: 16,
  },
  stillNeedHelpBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stillNeedHelpBtnText: {
    color: '#002538',
    fontSize: 13,
    fontFamily: F.sansBold,
    letterSpacing: -0.1,
  },

  resourcesSection: {
    marginBottom: 24,
  },
  resourceCardGroup: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    overflow: 'hidden',
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resourceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  resourceIconBadge: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resourceTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  resourceTitle: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  resourceSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },

  /* CONTACT & INFO MODALS */
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
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  modalSubtitle: {
    color: '#9E9E9E',
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  infoModalBadge: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  infoModalParagraph: {
    color: '#BDC8D2',
    fontSize: 13,
    fontFamily: F.sans,
    lineHeight: 19,
    marginBottom: 8,
  },
  modalCloseBtn: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  issueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  issueTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  issueTypeBtnActive: {
    backgroundColor: '#89CEFF',
  },
  issueTypeBtnText: {
    color: '#E0E3E6',
    fontSize: 11,
    fontFamily: F.sansMedium,
  },
  issueTypeBtnTextActive: {
    color: '#002538',
    fontFamily: F.sansBold,
  },
  modalTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: F.sans,
  },
  modalTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: F.sans,
  },
  diagNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(137, 206, 255, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  diagNoticeText: {
    flex: 1,
    color: '#89CEFF',
    fontSize: 10,
    fontFamily: F.sans,
    lineHeight: 14,
  },
  modalActions: {
    marginTop: 16,
    gap: 8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryBtnText: {
    color: '#002538',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#E0E3E6',
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
});
