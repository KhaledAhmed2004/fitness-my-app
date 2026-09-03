import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { Vital } from '@/constants/vital-theme';
import { MedicalEvent } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface HealthTimelineCardProps {
  event: MedicalEvent;
  onViewDocuments: (event: MedicalEvent) => void;
  onEditEvent?: (event: MedicalEvent) => void;
}

export function HealthTimelineCard({
  event,
  onViewDocuments,
  onEditEvent,
}: HealthTimelineCardProps) {
  const members = useHealthVaultStore((s) => s.members);
  const syncMedicinesToCabinet = useHealthVaultStore((s) => s.syncMedicinesToCabinet);
  const t = useLanguageStore((s) => s.t);
  const translateClinical = useLanguageStore((s) => s.translateClinical);

  const member = members.find((m) => m.id === event.memberId);
  const hasUnsyncedMeds = event.prescribedMedicines.some((m) => !m.syncedToCabinet);

  const handleSyncMedicines = async (e: any) => {
    e.stopPropagation();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await syncMedicinesToCabinet(event.prescribedMedicines);
  };

  return (
    <View style={styles.card}>
      {/* Top Header: Date & Member Badge */}
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <MaterialIcons name="event" size={13} color="#38BDF8" />
          <Text style={styles.dateText}>{event.eventDate}</Text>
        </View>

        {member && (
          <View
            style={[
              styles.memberBadge,
              { backgroundColor: `${member.avatarColor}20` },
            ]}>
            <Text
              style={[styles.memberBadgeText, { color: member.avatarColor }]}>
              {member.name} {member.bloodGroup !== 'UNKNOWN' ? `(${member.bloodGroup})` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Doctor & Hospital Row */}
      <View style={styles.doctorSection}>
        <View style={styles.docIconCircle}>
          <MaterialIcons name="health-and-safety" size={18} color="#20C997" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>
            {event.doctorName || 'Doctor Consultation'}
          </Text>
          <Text style={styles.doctorSub}>
            {event.specialty ? `${event.specialty} • ` : ''}
            {event.hospitalOrClinic || 'Chamber Visit'}
          </Text>
        </View>

        {event.totalCost > 0 && (
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>৳{event.totalCost.toLocaleString()}</Text>
          </View>
        )}
      </View>

      {/* Diagnosis / Reason Box */}
      <View style={styles.diagnosisBox}>
        <Text style={styles.diagnosisLabel}>{t('diagnosis_reason', 'DIAGNOSIS & REASON')}</Text>
        <Text style={styles.diagnosisText}>{translateClinical(event.diagnosisOrReason)}</Text>
        {event.notes ? <Text style={styles.notesText}>{event.notes}</Text> : null}
      </View>

      {/* Vitals Signs Chips */}
      {event.vitalSigns && Object.values(event.vitalSigns).some((v) => v !== undefined) && (
        <View style={styles.vitalsRow}>
          {event.vitalSigns.bloodPressure && (
            <View style={styles.vitalChip}>
              <MaterialIcons name="favorite" size={11} color="#F43F5E" />
              <Text style={styles.vitalChipText}>BP: {event.vitalSigns.bloodPressure}</Text>
            </View>
          )}

          {event.vitalSigns.pulse && (
            <View style={styles.vitalChip}>
              <MaterialIcons name="monitor-heart" size={11} color="#FF7849" />
              <Text style={styles.vitalChipText}>Pulse: {event.vitalSigns.pulse} bpm</Text>
            </View>
          )}

          {event.vitalSigns.temperatureF && (
            <View style={styles.vitalChip}>
              <MaterialIcons name="device-thermostat" size={11} color="#FCC419" />
              <Text style={styles.vitalChipText}>Temp: {event.vitalSigns.temperatureF}°F</Text>
            </View>
          )}

          {event.vitalSigns.bloodSugarMmol && (
            <View style={styles.vitalChip}>
              <MaterialIcons name="water-drop" size={11} color="#38BDF8" />
              <Text style={styles.vitalChipText}>Sugar: {event.vitalSigns.bloodSugarMmol} mmol</Text>
            </View>
          )}
        </View>
      )}

      {/* Prescribed Medicines Box */}
      {event.prescribedMedicines.length > 0 && (
        <View style={styles.medsBox}>
          <View style={styles.medsHeader}>
            <View style={styles.medsHeaderLeft}>
              <MaterialIcons name="medication" size={14} color="#FF922B" />
              <Text style={styles.medsHeaderTitle}>
                {t('prescribed_medicines', 'PRESCRIBED MEDICINES')} ({event.prescribedMedicines.length})
              </Text>
            </View>

            {hasUnsyncedMeds && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSyncMedicines}
                style={styles.syncMedsBtn}>
                <MaterialIcons name="add-task" size={12} color="#101416" />
                <Text style={styles.syncMedsBtnText}>{t('sync_cabinet_btn', 'Sync to Cabinet')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.medsList}>
            {event.prescribedMedicines.map((m, idx) => (
              <View key={idx} style={styles.medItem}>
                <View style={styles.medBullet} />
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDosage}>
                  {translateClinical(m.dosage)} ({translateClinical(m.duration)})
                </Text>
                {m.syncedToCabinet && (
                  <MaterialIcons name="check-circle" size={12} color="#20C997" />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer: Documents & Follow-up Actions */}
      <View style={styles.footerRow}>
        {event.documentIds.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onViewDocuments(event)}
            style={styles.docsBtn}>
            <MaterialIcons name="attach-file" size={14} color="#38BDF8" />
            <Text style={styles.docsBtnText}>
              {event.documentIds.length} Attached {event.documentIds.length === 1 ? 'Doc' : 'Docs'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noDocsPill}>
            <Text style={styles.noDocsText}>{t('no_attached_docs', 'No Attached Files')}</Text>
          </View>
        )}

        {onEditEvent && (
          <TouchableOpacity
            onPress={() => onEditEvent(event)}
            style={styles.editBtn}>
            <MaterialIcons name="edit" size={14} color={C.onSurfaceVariant} />
            <Text style={styles.editText}>{t('edit_btn', 'Edit')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181F23',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  doctorSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  costBadge: {
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  costBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  diagnosisBox: {
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 12,
    gap: 3,
  },
  diagnosisLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  diagnosisText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    fontStyle: 'italic',
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vitalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vitalChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  medsBox: {
    backgroundColor: '#13191C',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  medsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  medsHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#FF922B',
    letterSpacing: 0.4,
  },
  syncMedsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF922B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  syncMedsBtnText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#101416',
  },
  medsList: {
    gap: 4,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF922B',
  },
  medName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  medDosage: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  docsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  docsBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  noDocsPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  noDocsText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
});
