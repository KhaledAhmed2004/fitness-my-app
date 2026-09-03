/**
 * Gym Announcement & Member Broadcast Modal (GymOS)
 * Publish gym maintenance alerts, holiday schedules, and promotional upgrade offers to all gym athletes.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
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
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymAnnouncement } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymAnnouncementModal({ visible, onClose }: Props) {
  const { colors } = useThemeColors();
  const { announcements, createAnnouncement, deleteAnnouncement } = useGymOwnerStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'ALL_MEMBERS' | 'TRAINERS_ONLY' | 'EXPIRING_MEMBERS'>('ALL_MEMBERS');
  const [isPinned, setIsPinned] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required Fields', 'Please fill in both title and announcement text.');
      return;
    }

    await createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      targetAudience: audience,
      isPinned,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAddModalVisible(false);
    setTitle('');
    setContent('');
    Alert.alert('Broadcast Sent', 'Announcement has been published to member newsfeed.');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Facility Announcements</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Broadcast notices & schedule changes to members
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAddModalVisible(true)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="campaign" size={16} color="#000" />
              <Text style={styles.addBtnText}>New Notice</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LIST */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {announcements.map((anc) => (
            <View key={anc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {anc.isPinned ? <MaterialIcons name="push-pin" size={14} color="#FFB800" /> : null}
                    <Text style={[styles.ancTitle, { color: colors.textPrimary }]}>{anc.title}</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary, marginTop: 2 }}>
                    {anc.date} • Target: {anc.targetAudience.replace('_', ' ')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    void deleteAnnouncement(anc.id);
                  }}
                  style={{ padding: 4 }}>
                  <MaterialIcons name="delete-outline" size={18} color="#FA5252" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, fontFamily: F.sans, color: colors.textPrimary, lineHeight: 18, marginTop: 6 }}>
                {anc.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ----------------- CREATE MODAL ----------------- */}
        <Modal visible={addModalVisible} animationType="fade" transparent onRequestClose={() => setAddModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Create Announcement</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>TITLE *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Friday Generator Maintenance"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>MESSAGE CONTENT *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border, height: 75, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="Type full notice text..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={content}
                onChangeText={setContent}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>TARGET AUDIENCE</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {(['ALL_MEMBERS', 'TRAINERS_ONLY', 'EXPIRING_MEMBERS'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAudience(a)}
                    style={[
                      styles.pill,
                      audience === a
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.glassFill, borderColor: colors.border },
                    ]}>
                    <Text style={{ color: audience === a ? '#000' : colors.textPrimary, fontSize: 10, fontFamily: F.sansBold }}>
                      {a.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePublish} style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold }}>Broadcast Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontFamily: F.sansBold },
  subtitle: { fontSize: 12, fontFamily: F.sans, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addBtnText: { color: '#000', fontFamily: F.sansBold, fontSize: 12 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  ancTitle: { fontSize: 14, fontFamily: F.sansBold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontFamily: F.sansBold },
  inputLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5, marginBottom: 4 },
  modalInput: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans },
  pill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  sheetCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
