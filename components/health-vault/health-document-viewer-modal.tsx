import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DOCUMENT_TYPE_CONFIG,
} from '@/components/health-vault/health-vault-constants';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';
import { MedicalDocument } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface HealthDocumentViewerModalProps {
  visible: boolean;
  document: MedicalDocument | null;
  onClose: () => void;
  onDeleteDocument?: (id: string) => void;
}

export function HealthDocumentViewerModal({
  visible,
  document,
  onClose,
  onDeleteDocument,
}: HealthDocumentViewerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const doctors = useHealthVaultStore((s) => s.doctors);

  if (!document) return null;

  const member = members.find((m) => m.id === document.memberId);
  const doctor = doctors.find((d) => d.id === document.doctorId);
  const typeConfig = DOCUMENT_TYPE_CONFIG[document.type] || DOCUMENT_TYPE_CONFIG.OTHER;

  const handleShare = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (document.fileUri.startsWith('http')) {
      void Linking.openURL(document.fileUri);
    }
  };

  const handleDelete = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onDeleteDocument) {
      onDeleteDocument(document.id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.viewerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeConfig.bgColor },
                ]}>
                <MaterialIcons
                  name={typeConfig.icon}
                  size={16}
                  color={typeConfig.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {document.title}
                </Text>
                <Text style={styles.subtitle}>
                  {document.documentDate} • {member?.name || 'Family Member'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* Document Preview Box */}
            <View style={styles.previewBox}>
              {document.fileType === 'image' && document.fileUri ? (
                <Image
                  source={{ uri: document.fileUri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pdfFullPreview}>
                  <MaterialIcons name="picture-as-pdf" size={48} color="#F43F5E" />
                  <Text style={styles.pdfFullTitle}>Medical PDF Document</Text>
                  <Text style={styles.pdfFullSub}>{document.title}</Text>
                </View>
              )}
            </View>

            {/* Metadata Inspector Card */}
            <View style={styles.metaCard}>
              <Text style={styles.metaCardTitle}>DOCUMENT DETAILS</Text>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>DOCUMENT TYPE</Text>
                  <Text style={[styles.metaVal, { color: typeConfig.color }]}>
                    {typeConfig.label}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>PATIENT / MEMBER</Text>
                  <Text style={styles.metaVal}>
                    {member?.name || 'Khaled (Self)'}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>DATE RECORDED</Text>
                  <Text style={styles.metaVal}>{document.documentDate}</Text>
                </View>

                {(document.labOrHospital || doctor) && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>HOSPITAL / DOCTOR</Text>
                    <Text style={styles.metaVal}>
                      {document.labOrHospital || doctor?.name || 'General Clinic'}
                    </Text>
                  </View>
                )}

                {document.cost !== undefined && document.cost > 0 && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>COST / BILL</Text>
                    <Text style={[styles.metaVal, { color: '#20C997' }]}>
                      ৳{document.cost.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {document.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>NOTES & CLINICAL FINDINGS</Text>
                  <Text style={styles.notesContent}>{document.notes}</Text>
                </View>
              ) : null}

              {document.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={styles.tagsLabel}>TAGS</Text>
                  <View style={styles.tagsRow}>
                    {document.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {document.fileUri.startsWith('http') && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleShare}
                  style={styles.shareBtn}>
                  <MaterialIcons name="open-in-browser" size={16} color="#101416" />
                  <Text style={styles.shareBtnText}>Open Original File</Text>
                </TouchableOpacity>
              )}

              {onDeleteDocument && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDelete}
                  style={styles.deleteBtn}>
                  <MaterialIcons name="delete-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#181F23',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  previewBox: {
    height: 280,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  pdfFullPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pdfFullTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  pdfFullSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  metaCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  metaCardTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    width: '46%',
    gap: 2,
  },
  metaLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  metaVal: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  notesBox: {
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 10,
    gap: 3,
  },
  notesLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  notesContent: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  tagsSection: {
    gap: 4,
  },
  tagsLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FF6B6B',
  },
});
