import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { Vaccination } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface VaccinationCardProps {
  vaccination: Vaccination;
  onViewCertificate?: (docId: string) => void;
  onDelete?: (id: string) => void;
}

export function VaccinationCard({
  vaccination,
  onViewCertificate,
  onDelete,
}: VaccinationCardProps) {
  const isComplete =
    vaccination.totalDoses && vaccination.doseNumber >= vaccination.totalDoses;

  const today = new Date().toISOString().split('T')[0];
  const isUpcomingDue =
    vaccination.nextDueDate && vaccination.nextDueDate >= today;

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="vaccines" size={18} color="#20C997" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vaccineName}>{vaccination.vaccineName}</Text>
            <Text style={styles.vaccineDate}>
              Given on {vaccination.vaccinationDate}
            </Text>
          </View>
        </View>

        {/* Dose Badge */}
        <View
          style={[
            styles.dosePill,
            isComplete ? styles.dosePillComplete : styles.dosePillOngoing,
          ]}>
          <Text
            style={[
              styles.dosePillText,
              isComplete
                ? styles.dosePillTextComplete
                : styles.dosePillTextOngoing,
            ]}>
            {vaccination.totalDoses
              ? `Dose ${vaccination.doseNumber}/${vaccination.totalDoses}`
              : `Dose ${vaccination.doseNumber}`}
          </Text>
        </View>
      </View>

      {/* Provider & Batch Info */}
      <View style={styles.metaRow}>
        {vaccination.providerName ? (
          <View style={styles.metaItem}>
            <MaterialIcons name="local-hospital" size={12} color="#38BDF8" />
            <Text style={styles.metaText} numberOfLines={1}>
              {vaccination.providerName}
            </Text>
          </View>
        ) : null}

        {vaccination.batchNumber ? (
          <View style={styles.metaItem}>
            <MaterialIcons name="tag" size={12} color={C.onSurfaceVariant} />
            <Text style={styles.metaText}>Batch: {vaccination.batchNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* Next Dose Alert */}
      {isUpcomingDue && (
        <View style={styles.nextDueBanner}>
          <MaterialIcons name="event-available" size={14} color="#FF922B" />
          <Text style={styles.nextDueText}>
            Next Booster / Dose Due: {vaccination.nextDueDate}
          </Text>
        </View>
      )}

      {/* Notes */}
      {vaccination.notes ? (
        <Text style={styles.notesText}>{vaccination.notes}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.footerRow}>
        {vaccination.certificateDocumentId ? (
          <TouchableOpacity
            onPress={() =>
              onViewCertificate?.(vaccination.certificateDocumentId!)
            }
            style={styles.certBtn}>
            <MaterialIcons name="verified" size={14} color="#20C997" />
            <Text style={styles.certBtnText}>View Vaccine Certificate</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(vaccination.id)}
            style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={16} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  vaccineDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  dosePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dosePillComplete: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
  },
  dosePillOngoing: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  dosePillText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  dosePillTextComplete: {
    color: '#20C997',
  },
  dosePillTextOngoing: {
    color: '#38BDF8',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  nextDueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextDueText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FF922B',
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  certBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
  },
  deleteBtn: {
    padding: 4,
  },
});
