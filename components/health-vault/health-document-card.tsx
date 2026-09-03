import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Image,
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

interface HealthDocumentCardProps {
  document: MedicalDocument;
  onPress: (document: MedicalDocument) => void;
  onDelete?: (id: string) => void;
}

export function HealthDocumentCard({
  document,
  onPress,
  onDelete,
}: HealthDocumentCardProps) {
  const members = useHealthVaultStore((s) => s.members);
  const doctors = useHealthVaultStore((s) => s.doctors);

  const member = members.find((m) => m.id === document.memberId);
  const doctor = doctors.find((d) => d.id === document.doctorId);
  const typeConfig = DOCUMENT_TYPE_CONFIG[document.type] || DOCUMENT_TYPE_CONFIG.OTHER;

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(document);
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onDelete) {
      onDelete(document.id);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: typeConfig.bgColor },
          ]}>
          <MaterialIcons
            name={typeConfig.icon}
            size={13}
            color={typeConfig.color}
          />
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
            {typeConfig.label.split(' ')[0]}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {member && (
            <View
              style={[
                styles.memberBadge,
                { backgroundColor: `${member.avatarColor}20` },
              ]}>
              <Text
                style={[
                  styles.memberBadgeText,
                  { color: member.avatarColor },
                ]}>
                {member.name}
              </Text>
            </View>
          )}

          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <MaterialIcons name="close" size={16} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content & Thumbnail */}
      <View style={styles.bodyRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {document.title}
          </Text>

          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={12} color={C.onSurfaceVariant} />
            <Text style={styles.metaText}>{document.documentDate}</Text>
          </View>

          {(document.labOrHospital || doctor) && (
            <View style={styles.metaRow}>
              <MaterialIcons name="domain" size={12} color={C.onSurfaceVariant} />
              <Text style={styles.metaText} numberOfLines={1}>
                {document.labOrHospital || doctor?.hospitalOrClinic || doctor?.name}
              </Text>
            </View>
          )}

          {/* Tags */}
          {document.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {document.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Preview */}
        <View style={styles.thumbnailWrapper}>
          {document.fileType === 'image' && document.fileUri ? (
            <Image
              source={{ uri: document.fileUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.pdfThumbnail}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#F43F5E" />
              <Text style={styles.pdfText}>PDF</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  deleteBtn: {
    padding: 2,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tagChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#13191C',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  pdfThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    gap: 2,
  },
  pdfText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#F43F5E',
  },
});
