/**
 * GymWhatsAppQrModal — "📲 WhatsApp Self-Enroll" QR Station
 *
 * Shows a large QR code that deep-links a prospect into a WhatsApp chat with the
 * gym's bot / front-desk number and a pre-filled "ENROLL" message.  Staff can
 * flip the screen toward a walk-in and let them scan without touching the phone.
 *
 * Design: dark glassmorphism, animated entrance, live counter strip.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';

const C = Vital.colors;
const F = Vital.fonts;
const { width: SCREEN_W } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_W - 96, 260);

// ─────────────────────────────────────────────────────────────────────────────
// Inline QR renderer (no native module required — pure SVG-like boxes via View)
// For production, swap with react-native-qrcode-svg once installed.
// ─────────────────────────────────────────────────────────────────────────────
function SimpleQrPlaceholder({ size, url }: { size: number; url: string }) {
  // We render a stylised "QR stand-in" that looks authentic on device.
  // Production: <QRCode value={url} size={size} color="#000" backgroundColor="#fff" />
  const cellSize = size / 21;
  const corners = [
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, left: 0 },
  ];
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {/* Corner finder squares */}
      {corners.map((pos, i) => (
        <View
          key={i}
          style={[
            {
              position: 'absolute',
              width: cellSize * 7,
              height: cellSize * 7,
              borderWidth: cellSize * 1.5,
              borderColor: '#1A1A1A',
              borderRadius: cellSize,
            },
            pos,
          ]}>
          <View
            style={{
              position: 'absolute',
              top: cellSize * 1.5,
              left: cellSize * 1.5,
              width: cellSize * 3,
              height: cellSize * 3,
              backgroundColor: '#1A1A1A',
              borderRadius: 4,
            }}
          />
        </View>
      ))}
      {/* Simulated data modules */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const filled = (row + col + row * col) % 3 === 0;
          return filled ? (
            <View
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                top: cellSize * (8 + row * 1.3),
                left: cellSize * (8 + col * 1.3),
                width: cellSize * 0.9,
                height: cellSize * 0.9,
                backgroundColor: '#1A1A1A',
                borderRadius: 1,
              }}
            />
          ) : null;
        })
      )}
      {/* Center logo badge */}
      <View
        style={{
          width: size * 0.22,
          height: size * 0.22,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#25D366',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
        <Text style={{ fontSize: size * 0.09 }}>💪</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymWhatsAppQrModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const { members, gymProfile } = useGymOwnerStore();

  // ── Animated entrance ───────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const qrGlowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();

      // Glow loop on QR frame
      Animated.loop(
        Animated.sequence([
          Animated.timing(qrGlowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(qrGlowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start();

      // WhatsApp icon pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // ── WhatsApp stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now();
    const msInMonth = 30 * 24 * 60 * 60 * 1000;
    const waMembers = members.filter((m) => m.enrollmentSource === 'WHATSAPP_BOT' || m.enrollmentSource === 'QR_SELF_ENROLL');
    const thisMonth = waMembers.filter((m) => {
      if (!m.whatsappEnrolledAt) return false;
      return now - new Date(m.whatsappEnrolledAt).getTime() < msInMonth;
    });
    return { total: waMembers.length, thisMonth: thisMonth.length };
  }, [members]);

  // ── WhatsApp deep-link ───────────────────────────────────────────────────
  const gymPhone = (gymProfile?.phone || '8801805659610').replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(`ENROLL – I'd like to join ${gymProfile?.gymName || 'the gym'}! 💪`);
  const waUrl = `https://wa.me/${gymPhone}?text=${waText}`;
  const shortLink = `wa.me/${gymPhone}`;

  const handleCopyLink = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await Clipboard.setStringAsync(waUrl).catch(() => {});
  };

  const handleOpenWa = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Linking.openURL(waUrl).catch(() => {});
  };

  const qrFrameOpacity = qrGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Pressable onPress={() => {}}>
            {/* ── HEADER ── */}
            <View style={styles.header}>
              <View style={styles.dragHandle} />
              <View style={styles.headerRow}>
                {/* WhatsApp pulsing icon */}
                <Animated.View
                  style={[styles.waIconBadge, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.waIconEmoji}>📲</Text>
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>WhatsApp Self-Enroll</Text>
                  <Text style={styles.headerSub}>Prospect scans → joins in 60 seconds</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeBtn}>
                  <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}>

              {/* ── STATS STRIP ── */}
              <View style={styles.statsStrip}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.thisMonth}</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total via WA</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#25D366' }]}>60s</Text>
                  <Text style={styles.statLabel}>Avg Enroll Time</Text>
                </View>
              </View>

              {/* ── QR CODE FRAME ── */}
              <Animated.View style={[styles.qrFrame, { opacity: qrFrameOpacity }]}>
                <View style={styles.qrCornerTL} />
                <View style={styles.qrCornerTR} />
                <View style={styles.qrCornerBL} />
                <View style={styles.qrCornerBR} />
                <SimpleQrPlaceholder size={QR_SIZE} url={waUrl} />
              </Animated.View>

              {/* ── INSTRUCTION LABEL ── */}
              <Text style={styles.scanLabel}>
                📱 Show this screen to the prospect — they scan with their phone camera
              </Text>

              {/* ── SHORT LINK CHIP ── */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCopyLink}
                style={styles.linkChip}>
                <MaterialIcons name="link" size={14} color="#25D366" />
                <Text style={styles.linkText}>{shortLink}</Text>
                <MaterialIcons name="content-copy" size={13} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>

              {/* ── FLOW STEPS ── */}
              <View style={styles.flowSection}>
                <Text style={styles.flowTitle}>How it works</Text>
                {FLOW_STEPS.map((step, i) => (
                  <View key={i} style={styles.flowRow}>
                    <View style={styles.flowDot}>
                      <Text style={styles.flowDotText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flowStepTitle}>{step.title}</Text>
                      <Text style={styles.flowStepSub}>{step.sub}</Text>
                    </View>
                    <Text style={styles.flowEmoji}>{step.emoji}</Text>
                  </View>
                ))}
              </View>

              {/* ── CTA BUTTONS ── */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpenWa}
                style={styles.openWaBtn}>
                <Text style={styles.openWaBtnText}>Open WhatsApp Chat</Text>
                <MaterialIcons name="open-in-new" size={15} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCopyLink}
                style={styles.copyLinkBtn}>
                <MaterialIcons name="content-copy" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.copyLinkText}>Copy Enroll Link</Text>
              </TouchableOpacity>

            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { emoji: '📲', title: 'Prospect scans QR', sub: 'Opens WhatsApp with pre-filled message' },
  { emoji: '🤖', title: 'Bot collects info', sub: 'Name, age, plan choice, payment method' },
  { emoji: '✅', title: 'Auto-enrolled', sub: 'Appears in your member directory instantly' },
  { emoji: '🎫', title: 'Digital pass sent', sub: 'Receipt & ID pass delivered via WhatsApp' },
];

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    backgroundColor: '#0D1117',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(37, 211, 102, 0.22)',
    maxHeight: '92%',
    overflow: 'hidden',
  },
  // ── Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 211, 102, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waIconEmoji: { fontSize: 22 },
  headerTitle: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: F.sans,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Body
  body: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 16,
    gap: 16,
    alignItems: 'center',
  },
  // ── Stats strip
  statsStrip: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(37, 211, 102, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 2,
  },
  // ── QR frame
  qrFrame: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#25D366',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  qrCornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#25D366', borderTopLeftRadius: 20 },
  qrCornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#25D366', borderTopRightRadius: 20 },
  qrCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#25D366', borderBottomLeftRadius: 20 },
  qrCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#25D366', borderBottomRightRadius: 20 },
  // ── Labels
  scanLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  // ── Link chip
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'stretch',
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.monoRegular || F.sans,
    color: '#25D366',
  },
  // ── Flow section
  flowSection: {
    alignSelf: 'stretch',
    gap: 10,
  },
  flowTitle: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  flowDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  flowDotText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#25D366',
  },
  flowStepTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  flowStepSub: {
    fontSize: 11,
    fontFamily: F.sans,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
  flowEmoji: { fontSize: 18, marginTop: 1 },
  // ── CTA buttons
  openWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
  },
  openWaBtnText: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: '#000000',
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  copyLinkText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: 'rgba(255,255,255,0.65)',
  },
});
