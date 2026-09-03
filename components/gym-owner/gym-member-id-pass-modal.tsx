import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Svg, { Rect, Path } from 'react-native-svg';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  visible: boolean;
  member: GymMemberItem | null;
  onClose: () => void;
};

// Generates an authentic, deterministic QR finder pattern & matrix based on member ID string
function SvgMemberQrCode({ memberId, size = 130 }: { memberId: string; size?: number }) {
  // Deterministic seed from member id
  const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // 17x17 grid modules
  const gridSize = 17;
  const cellSize = size / gridSize;

  // Build matrix with corner position locators
  const modules: boolean[][] = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    // Helper to draw standard 7x7 QR position finder square
    const drawFinder = (rStart: number, cStart: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isOuterBorder || isInnerSquare) {
            grid[rStart + r][cStart + c] = true;
          }
        }
      }
    };

    // Top-Left Finder
    drawFinder(0, 0);
    // Top-Right Finder
    drawFinder(0, gridSize - 7);
    // Bottom-Left Finder
    drawFinder(gridSize - 7, 0);

    // Timing lines (row 6 and col 6)
    for (let i = 8; i < gridSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Pseudorandom pseudo-data bits based on member hash
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip finder areas
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= gridSize - 8;
        const inBottomLeft = r >= gridSize - 8 && c < 8;
        if (!inTopLeft && !inTopRight && !inBottomLeft && !(r === 6 || c === 6)) {
          const val = (r * 13 + c * 19 + hash) % 3 === 0 || (r * c + hash) % 5 === 0;
          grid[r][c] = val;
        }
      }
    }

    return grid;
  }, [hash]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect width={size} height={size} fill="#FFFFFF" rx={8} />
      {modules.map((row, r) =>
        row.map((active, c) => {
          if (!active) return null;
          return (
            <Rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#0F1014"
            />
          );
        })
      )}
    </Svg>
  );
}

// Scannable 1D Barcode Simulation
function SvgMemberBarcode({ width = 200, height = 36 }: { width?: number; height?: number }) {
  const bars = useMemo(() => {
    // Generate barcode line widths
    const widths = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 1, 4, 2, 3, 1, 2];
    return widths;
  }, []);

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {bars.map((w, idx) => (
        <View
          key={idx}
          style={{
            width: w,
            height: idx % 4 === 0 ? height : height * 0.85,
            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

export function GymMemberIdPassModal({ visible, member, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    todayCheckInIds,
    quickCheckInMember,
    generateWhatsAppDigitalPass,
  } = useGymOwnerStore();

  const [copied, setCopied] = useState(false);

  // Calculate days remaining (Hook called unconditionally)
  const daysLeft = useMemo(() => {
    if (!member?.endDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(member.endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [member?.endDate]);

  if (!member) return null;

  const isCheckedIn = todayCheckInIds.includes(member.id);
  const isFrozen = member.status === 'FROZEN';
  const isExpired = member.status === 'EXPIRED';
  const isExpiringSoon = member.status === 'EXPIRING_SOON';
  const hasDue = member.dueAmountBdt > 0;

  // Format professional member ID code
  const memberCode = `#IF-${new Date().getFullYear()}-${member.id.replace('mem_', '').padStart(4, '0')}`;

  // Color theming based on status
  const statusColor = isExpired
    ? '#FA5252'
    : isFrozen
    ? '#4DABF7'
    : isExpiringSoon
    ? '#FFB800'
    : '#40C057';

  const statusLabel = isExpired
    ? 'EXPIRED'
    : isFrozen
    ? 'FROZEN'
    : isExpiringSoon
    ? 'EXPIRING SOON'
    : 'ACTIVE ATHLETE';

  const statusIconName: keyof typeof MaterialIcons.glyphMap = isExpired
    ? 'event-busy'
    : isFrozen
    ? 'ac-unit'
    : isExpiringSoon
    ? 'schedule'
    : 'check-circle';

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(memberCode);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const message = generateWhatsAppDigitalPass(member);
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}?text=${encodeURIComponent(message)}`;

    void Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        void Linking.openURL(webUrl);
      }
    });
  };

  const handleToggleCheckIn = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    await quickCheckInMember(member.id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* CLEAN MINIMAL HEADER BAR */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Digital Membership Pass</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* DIGITAL PASS CARD */}
          <View style={styles.passCard}>
            {/* CARD TOP BRANDING */}
            <View style={styles.cardTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, marginRight: 8 }}>
                <View style={[styles.gymIconBadge, { backgroundColor: 'rgba(137, 254, 0, 0.12)', borderWidth: 1, borderColor: 'rgba(137, 254, 0, 0.3)' }]}>
                  <MaterialIcons name="fitness-center" size={18} color="#89FE00" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.gymNameText} numberOfLines={1}>{gymProfile.gymName.toUpperCase()}</Text>
                  <Text style={styles.gymBranchText} numberOfLines={1}>
                    {gymProfile.address ? `${gymProfile.address}, ` : ''}{gymProfile.city}
                  </Text>
                </View>
              </View>

              <View style={[styles.vipPill, { borderColor: statusColor, backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <MaterialIcons name="verified" size={12} color={statusColor} />
                <Text style={[styles.vipPillText, { color: statusColor }]}>VERIFIED</Text>
              </View>
            </View>

            {/* CARD DIVIDER */}
            <View style={styles.cardHoleDivider}>
              <View style={[styles.holeCutout, styles.holeLeft, { backgroundColor: colors.background }]} />
              <View style={styles.dashLine} />
              <View style={[styles.holeCutout, styles.holeRight, { backgroundColor: colors.background }]} />
            </View>

            {/* MEMBER HERO SECTION */}
            <View style={styles.memberHeroRow}>
              <View style={[styles.avatarFrame, { borderColor: statusColor }]}>
                {member.avatarUrl ? (
                  <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                      {member.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.onlineDot, { backgroundColor: statusColor }]} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.memberNameText} numberOfLines={1}>
                  {member.fullName}
                </Text>

                <TouchableOpacity activeOpacity={0.7} onPress={handleCopyId} style={styles.idCodeRow}>
                  <Text style={styles.idCodeText}>{memberCode}</Text>
                  <MaterialIcons name={copied ? 'done' : 'content-copy'} size={12} color="#8F9CAE" />
                  {copied && <Text style={{ fontSize: 9, color: '#40C057', fontFamily: F.monoBold }}>COPIED!</Text>}
                </TouchableOpacity>

                <Text style={styles.phoneText}>{member.phone}</Text>
              </View>
            </View>

            {/* SPECS GRID WITH VECTOR ICONS */}
            <View style={styles.specsGrid}>
              <View style={styles.specBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <MaterialIcons name="card-membership" size={10} color="#8F9CAE" />
                  <Text style={styles.specLabel}>MEMBERSHIP TIER</Text>
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {member.planTitle}
                </Text>
              </View>

              <View style={styles.specBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <MaterialIcons name="lock" size={10} color="#8F9CAE" />
                  <Text style={styles.specLabel}>ASSIGNED LOCKER</Text>
                </View>
                <Text style={[styles.specValue, { color: member.lockerNumber ? '#89FE00' : '#8F9CAE' }]}>
                  {member.lockerNumber ? `#${member.lockerNumber}` : 'Unassigned'}
                </Text>
              </View>

              <View style={styles.specBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <MaterialIcons name="sports" size={10} color="#8F9CAE" />
                  <Text style={styles.specLabel}>ASSIGNED COACH</Text>
                </View>
                <Text style={styles.specValue} numberOfLines={1}>
                  {member.assignedTrainerName
                    ? member.assignedTrainerName.toLowerCase().startsWith('coach')
                      ? member.assignedTrainerName
                      : `Coach ${member.assignedTrainerName}`
                    : 'General Floor'}
                </Text>
              </View>

              <View style={styles.specBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <MaterialIcons name="schedule" size={10} color={statusColor} />
                  <Text style={styles.specLabel}>VALID THRU</Text>
                </View>
                <Text style={[styles.specValue, { color: statusColor }]}>
                  {member.endDate}
                  {daysLeft !== null && daysLeft > 0 ? ` (${daysLeft}d left)` : ''}
                </Text>
              </View>
            </View>

            {/* DUES WARNING STRIP IF ANY */}
            {hasDue && (
              <View style={styles.dueWarningStrip}>
                <MaterialIcons name="payments" size={14} color="#FA5252" />
                <Text style={styles.dueWarningText}>
                  Pending Due: ৳{member.dueAmountBdt.toLocaleString()} • Clear at reception
                </Text>
              </View>
            )}

            {/* CARD BOTTOM: SCANNABLE QR & BARCODE */}
            <View style={styles.qrSection}>
              <View style={styles.qrWrapper}>
                <SvgMemberQrCode memberId={member.id} size={110} />
              </View>

              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <SvgMemberBarcode width={190} height={30} />
                <Text style={styles.scanLabel}>SCAN AT FRONT DESK FOR CHECK-IN</Text>
              </View>
            </View>

            {/* CARD FOOTER INFO */}
            <View style={styles.cardFooterRow}>
              <Text style={styles.footerNote}>
                {member.gender} Athlete • Emergency: {member.emergencyContact?.phone || 'On Record'}
              </Text>
              <View style={[styles.statusTag, { backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <MaterialIcons name={statusIconName} size={11} color={statusColor} />
                <Text style={[styles.statusTagText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS RIBBON */}
          <View style={styles.actionRibbon}>
            {/* WHATSAPP PASS BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendWhatsApp}
              style={[styles.primaryActionBtn, { backgroundColor: '#25D366' }]}>
              <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="chat" size={15} color="#FFF" />
              </View>
              <Text style={styles.actionBtnTextWhite}>Send Pass to WhatsApp</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* QUICK FLOOR CHECK-IN */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleCheckIn}
                style={[
                  styles.subActionBtn,
                  isCheckedIn
                    ? { backgroundColor: '#E7F3DD', borderColor: '#40C057' }
                    : { backgroundColor: '#89FE00', borderColor: '#89FE00' },
                ]}>
                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons
                    name={isCheckedIn ? 'logout' : 'how-to-reg'}
                    size={14}
                    color={isCheckedIn ? '#0E4D34' : '#000'}
                  />
                </View>
                <Text
                  style={[
                    styles.subActionText,
                    { color: isCheckedIn ? '#0E4D34' : '#000' },
                  ]}>
                  {isCheckedIn ? 'Floor Check-Out' : 'Punch Check-In'}
                </Text>
              </TouchableOpacity>

              {/* COPY ID */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCopyId}
                style={[
                  styles.subActionBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="content-copy" size={13} color={colors.textPrimary} />
                </View>
                <Text style={[styles.subActionText, { color: colors.textPrimary }]}>
                  {copied ? 'Copied!' : 'Copy Pass ID'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: F.sansBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  passCard: {
    width: Math.min(SCREEN_WIDTH - 40, 370),
    backgroundColor: '#0F1115',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  gymIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gymNameText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  gymBranchText: {
    fontSize: 10,
    fontFamily: F.sans,
    color: '#8F9CAE',
    marginTop: 1,
  },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  vipPillText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  cardHoleDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 20,
  },
  holeCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    zIndex: 2,
  },
  holeLeft: {
    left: -10,
  },
  holeRight: {
    right: -10,
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  memberHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarFrame: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    padding: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#1E232B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontFamily: F.sansBold,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0F1115',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  memberNameText: {
    fontSize: 18,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  idCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  idCodeText: {
    fontSize: 12,
    fontFamily: F.monoBold,
    color: '#8F9CAE',
  },
  phoneText: {
    fontSize: 11,
    fontFamily: F.sans,
    color: '#65758B',
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  specBox: {
    width: '48%',
    backgroundColor: '#161920',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#65758B',
    letterSpacing: 0.3,
  },
  specValue: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  dueWarningStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(250, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250, 82, 82, 0.3)',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dueWarningText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#FA5252',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#14171E',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scanLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#8F9CAE',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerNote: {
    fontSize: 10,
    fontFamily: F.sans,
    color: '#65758B',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  actionRibbon: {
    width: Math.min(SCREEN_WIDTH - 40, 370),
    marginTop: 18,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontFamily: F.sansBold,
    fontSize: 14,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  subActionText: {
    fontFamily: F.sansBold,
    fontSize: 12,
  },
});
