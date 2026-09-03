/**
 * Transformation Proof Builder Modal — Month-1 Retention & Progress Showcase
 * Allows coaches to capture, compare side-by-side progress photos,
 * celebrate strength PR milestones, and export 1-tap WhatsApp transformation cards.
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import type { AthleteClientDossier, ClientProgressPhoto } from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

interface TransformationProofBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  client: AthleteClientDossier | null;
}

export function TransformationProofBuilderModal({
  visible,
  onClose,
  client,
}: TransformationProofBuilderModalProps) {
  const { addProgressPhoto, removeProgressPhoto, profile } = useTrainerStore();
  const viewShotRef = useRef<ViewShotRef>(null);

  const [addPhotoModalVisible, setAddPhotoModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [photoLabel, setPhotoLabel] = useState('Week 4 Check-in');
  const [photoWeight, setPhotoWeight] = useState('');
  const [photoBodyFat, setPhotoBodyFat] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');

  // Selected Before & After Indices
  const photos = client?.progressPhotos || [];
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(Math.max(0, photos.length - 1));

  if (!client) return null;

  const startingWeight = client.startingWeightKg;
  const currentWeight = client.currentWeightKg;
  const weightDiff = (currentWeight - startingWeight).toFixed(1);
  const isLoss = currentWeight <= startingWeight;

  const handlePickImage = async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
        setPhotoWeight(client.currentWeightKg ? String(client.currentWeightKg) : '');
        setPhotoBodyFat(client.bodyFatPercent ? String(client.bodyFatPercent) : '');
        setAddPhotoModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Permission Error', 'Please grant photo gallery permission in device settings.');
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedImageUri) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await addProgressPhoto(client.id, {
      uri: selectedImageUri,
      label: photoLabel.trim() || 'Progress Check-in',
      weightAtTime: photoWeight ? parseFloat(photoWeight) : undefined,
      bodyFatAtTime: photoBodyFat ? parseFloat(photoBodyFat) : undefined,
      notes: photoNotes.trim() || undefined,
    });

    setAddPhotoModalVisible(false);
    setSelectedImageUri(null);
    setPhotoLabel('Week 4 Check-in');
    setPhotoNotes('');
    setAfterIndex(photos.length); // select latest
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to remove this progress record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeProgressPhoto(client.id, photoId);
          setBeforeIndex(0);
          setAfterIndex(0);
        },
      },
    ]);
  };

  const beforePhoto: ClientProgressPhoto | undefined = photos[beforeIndex];
  const afterPhoto: ClientProgressPhoto | undefined = photos[afterIndex];

  // Clean phone number for WhatsApp
  const getCleanPhone = (phoneStr: string) => {
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) clean = '88' + clean;
    else if (!clean.startsWith('88')) clean = '880' + clean;
    return clean;
  };

  const generateTransformationMessage = () => {
    const coach = profile.name || 'Coach';
    return (
`🔥 *VITAL FITNESS — TRANSFORMATION MILESTONE REPORT* 🔥
────────────────────────
👤 *Athlete:* ${client.name}
🏆 *Coach:* ${coach}
🎯 *Goal:* ${client.goal}

📊 *PHYSIQUE & BODY COMPOSITION:*
• Starting Weight: *${startingWeight} kg* 🏁
• Current Weight: *${currentWeight} kg* (${isLoss ? `-${Math.abs(Number(weightDiff))} kg Fat Loss` : `+${weightDiff} kg Mass Gain`}) 🎯
• Body Fat: *${client.bodyFatPercent || '14.5'}%*
• Sessions Done: *${client.package.completedSessions} of ${client.package.totalSessions} Sessions* ✅

⭐ *COACH COMMENDATION:*
"Phenomenal consistency! Your mechanical discipline and nutritional adherence are producing undeniable visual results. Keep crushing it!"

────────────────────────
_Vital Fitness Coach Operating System_`
    );
  };

  const handleShareToWhatsApp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const phone = getCleanPhone(client.phone);
    const message = encodeURIComponent(generateTransformationMessage());
    const url = `whatsapp://send?phone=${phone}&text=${message}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;

    try {
      const sup = await Linking.canOpenURL(url);
      if (sup) await Linking.openURL(url);
      else await Linking.openURL(webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const handleCaptureCard = async () => {
    if (!viewShotRef.current) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        await Share.share({
          url: uri,
          message: generateTransformationMessage(),
          title: `${client.name} Transformation Milestone`,
        });
      }
    } catch {
      await Share.share({ message: generateTransformationMessage() });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="auto-graph" size={20} color="#89FE00" />
              </View>
              <View>
                <Text style={styles.headerTitle}>TRANSFORMATION PROOF</Text>
                <Text style={styles.headerSub}>{client.name} • Visual Milestone Vault</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={C.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* STATS HIGHLIGHT BENTO */}
            <View style={styles.statsBento}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>STARTING</Text>
                <Text style={styles.statVal}>{startingWeight} kg</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>CURRENT</Text>
                <Text style={[styles.statVal, { color: '#89FE00' }]}>{currentWeight} kg</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DELTA</Text>
                <Text style={[styles.statVal, { color: isLoss ? '#89FE00' : '#00B4D8' }]}>
                  {weightDiff} kg
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>COMPLETED</Text>
                <Text style={[styles.statVal, { color: '#FFB800' }]}>
                  {client.package.completedSessions}/{client.package.totalSessions}
                </Text>
              </View>
            </View>

            {/* SIDE-BY-SIDE PROOF CARD (CAPTUREABLE) */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }} style={styles.proofCard}>
              <View style={styles.proofCardHeader}>
                <View style={styles.proofBadge}>
                  <MaterialIcons name="workspace-premium" size={14} color="#002233" />
                  <Text style={styles.proofBadgeText}>VERIFIED PROGRESS REPORT</Text>
                </View>
                <Text style={styles.proofClientName}>{client.name}</Text>
                <Text style={styles.proofMeta}>{client.currentPhase}</Text>
              </View>

              {/* PHOTO COMPARISON ROW */}
              {photos.length >= 2 ? (
                <View style={styles.comparisonRow}>
                  {/* BEFORE PHOTO */}
                  <View style={styles.photoContainer}>
                    {beforePhoto ? (
                      <Image source={{ uri: beforePhoto.uri }} style={styles.progressImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.noPhotoBox}>
                        <MaterialIcons name="photo" size={32} color={C.onSurfaceVariant} />
                        <Text style={styles.noPhotoText}>No Before Photo</Text>
                      </View>
                    )}
                    <View style={styles.photoTagBadge}>
                      <Text style={styles.photoTagText}>{beforePhoto?.label || 'Day 1'}</Text>
                      {beforePhoto?.weightAtTime && (
                        <Text style={styles.photoSubTag}>{beforePhoto.weightAtTime}kg</Text>
                      )}
                    </View>
                  </View>

                  {/* VS DIVIDER */}
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  {/* AFTER PHOTO */}
                  <View style={styles.photoContainer}>
                    {afterPhoto ? (
                      <Image source={{ uri: afterPhoto.uri }} style={styles.progressImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.noPhotoBox}>
                        <MaterialIcons name="photo" size={32} color={C.onSurfaceVariant} />
                        <Text style={styles.noPhotoText}>No After Photo</Text>
                      </View>
                    )}
                    <View style={[styles.photoTagBadge, { backgroundColor: 'rgba(137, 254, 0, 0.9)' }]}>
                      <Text style={[styles.photoTagText, { color: '#002233' }]}>
                        {afterPhoto?.label || 'Latest'}
                      </Text>
                      {afterPhoto?.weightAtTime && (
                        <Text style={[styles.photoSubTag, { color: '#002233' }]}>
                          {afterPhoto.weightAtTime}kg
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : photos.length === 1 ? (
                <View style={styles.singlePhotoContainer}>
                  <Image source={{ uri: photos[0].uri }} style={styles.singleImg} resizeMode="cover" />
                  <View style={styles.singlePhotoOverlay}>
                    <Text style={styles.singlePhotoLabel}>{photos[0].label}</Text>
                    <Text style={styles.singlePhotoMeta}>
                      {photos[0].weightAtTime ? `${photos[0].weightAtTime} kg • ` : ''}
                      {photos[0].date}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyGalleryBox}>
                  <MaterialIcons name="add-a-photo" size={42} color={C.onSurfaceVariant} />
                  <Text style={styles.emptyGalleryTitle}>No Progress Photos Yet</Text>
                  <Text style={styles.emptyGallerySub}>
                    Upload Day-1 baseline and weekly check-in photos to build visual transformation proof.
                  </Text>
                  <TouchableOpacity onPress={handlePickImage} style={styles.addPhotoCta}>
                    <MaterialIcons name="file-upload" size={16} color="#002233" />
                    <Text style={styles.addPhotoCtaText}>Upload First Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STRENGTH PR & METRICS FOOTER */}
              <View style={styles.proofMetrics}>
                <View style={styles.metricItem}>
                  <MaterialIcons name="bolt" size={16} color="#89FE00" />
                  <Text style={styles.metricItemText}>
                    {client.goal === 'FAT_LOSS'
                      ? 'Metabolic Conditioning Streak'
                      : 'Progressive Overload Verified'}
                  </Text>
                </View>
                <View style={styles.coachSignRow}>
                  <Text style={styles.coachSignText}>Coach: {profile.name || 'Personal Trainer'}</Text>
                  <Text style={styles.gymSignText}>{profile.gymAffiliation || 'Vital Gym'}</Text>
                </View>
              </View>
            </ViewShot>

            {/* PHOTO GALLERY THUMBNAILS */}
            {photos.length > 0 && (
              <View style={styles.gallerySection}>
                <View style={styles.galleryHeaderRow}>
                  <Text style={styles.sectionTitle}>PHOTO VAULT ({photos.length})</Text>
                  <TouchableOpacity onPress={handlePickImage} style={styles.galleryAddBtn}>
                    <MaterialIcons name="add-photo-alternate" size={16} color="#89FE00" />
                    <Text style={styles.galleryAddText}>+ Add Photo</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                  {photos.map((item, idx) => (
                    <View key={item.id} style={styles.thumbWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.thumbImg} />
                      <Text style={styles.thumbLabel} numberOfLines={1}>{item.label}</Text>
                      <View style={styles.thumbActions}>
                        <TouchableOpacity
                          onPress={() => setBeforeIndex(idx)}
                          style={[styles.setSideBtn, beforeIndex === idx && styles.setSideBtnActive]}>
                          <Text style={styles.setSideText}>Before</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setAfterIndex(idx)}
                          style={[styles.setSideBtn, afterIndex === idx && styles.setSideBtnActiveGreen]}>
                          <Text style={styles.setSideText}>After</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePhoto(item.id)}
                          style={styles.delThumbBtn}>
                          <MaterialIcons name="delete-outline" size={12} color="#FF5C5C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* ACTION BAR */}
          <View style={styles.actionBar}>
            <TouchableOpacity onPress={handlePickImage} style={styles.actionBtnSec}>
              <MaterialIcons name="add-a-photo" size={18} color={C.onSurface} />
              <Text style={styles.actionBtnSecText}>Add Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCaptureCard} style={styles.actionBtnPurple}>
              <MaterialIcons name="image" size={18} color="#A78BFA" />
              <Text style={styles.actionBtnPurpleText}>Share Card</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShareToWhatsApp} style={styles.actionBtnWhatsApp}>
              <MaterialIcons name="chat" size={18} color="#002233" />
              <Text style={styles.actionBtnWhatsAppText}>Send WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ADD PHOTO DETAILS MODAL */}
      <Modal visible={addPhotoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addPhotoModalBox}>
            <Text style={styles.addPhotoTitle}>SAVE PROGRESS PHOTO</Text>

            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewAddImg} resizeMode="cover" />
            )}

            <TextInput
              style={styles.input}
              value={photoLabel}
              onChangeText={setPhotoLabel}
              placeholder="e.g. Day 1 Baseline, Week 4 Check-in"
              placeholderTextColor={C.onSurfaceVariant}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={photoWeight}
                onChangeText={setPhotoWeight}
                placeholder="Weight (kg)"
                keyboardType="numeric"
                placeholderTextColor={C.onSurfaceVariant}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={photoBodyFat}
                onChangeText={setPhotoBodyFat}
                placeholder="Body Fat %"
                keyboardType="numeric"
                placeholderTextColor={C.onSurfaceVariant}
              />
            </View>

            <TextInput
              style={[styles.input, { height: 60 }]}
              value={photoNotes}
              onChangeText={setPhotoNotes}
              placeholder="Notes (e.g. waist -2 inches, posture improved)"
              multiline
              placeholderTextColor={C.onSurfaceVariant}
            />

            <View style={styles.addModalActions}>
              <TouchableOpacity
                onPress={() => setAddPhotoModalVisible(false)}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePhoto} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A121A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#89FE00',
    fontFamily: F.sansBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  headerSub: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansRegular,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  statsBento: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statLabel: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
  },
  statVal: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansBold,
    marginTop: 2,
  },
  proofCard: {
    backgroundColor: '#0E1A26',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16,
  },
  proofCardHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  proofBadgeText: {
    color: '#002233',
    fontSize: 9,
    fontFamily: F.sansBold,
  },
  proofClientName: {
    color: C.onSurface,
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  proofMeta: {
    color: '#00B4D8',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  photoContainer: {
    flex: 1,
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    position: 'relative',
  },
  progressImg: {
    width: '100%',
    height: '100%',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    marginTop: 4,
  },
  photoTagBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  photoTagText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  photoSubTag: {
    color: '#89FE00',
    fontSize: 9,
    fontFamily: F.sansMedium,
  },
  vsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFB800',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: {
    color: '#002233',
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  singlePhotoContainer: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  singleImg: {
    width: '100%',
    height: '100%',
  },
  singlePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 10,
  },
  singlePhotoLabel: {
    color: '#89FE00',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  singlePhotoMeta: {
    color: C.onSurfaceVariant,
    fontSize: 11,
  },
  emptyGalleryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
  },
  emptyGalleryTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 10,
  },
  emptyGallerySub: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  addPhotoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addPhotoCtaText: {
    color: '#002233',
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  proofMetrics: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItemText: {
    color: '#89FE00',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  coachSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  coachSignText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansRegular,
  },
  gymSignText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansRegular,
  },
  gallerySection: {
    marginTop: 6,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
  },
  galleryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  galleryAddText: {
    color: '#89FE00',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  thumbScroll: {
    flexDirection: 'row',
  },
  thumbWrapper: {
    width: 100,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  thumbImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 4,
  },
  thumbLabel: {
    color: C.onSurface,
    fontSize: 9,
    fontFamily: F.sansMedium,
    marginBottom: 4,
  },
  thumbActions: {
    flexDirection: 'row',
    gap: 2,
  },
  setSideBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  setSideBtnActive: {
    backgroundColor: '#00B4D8',
  },
  setSideBtnActiveGreen: {
    backgroundColor: '#89FE00',
  },
  setSideText: {
    color: '#FFF',
    fontSize: 7,
    fontFamily: F.sansBold,
  },
  delThumbBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnSec: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnSecText: {
    color: C.onSurface,
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  actionBtnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  actionBtnPurpleText: {
    color: '#A78BFA',
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  actionBtnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#89FE00',
  },
  actionBtnWhatsAppText: {
    color: '#002233',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  addPhotoModalBox: {
    backgroundColor: '#0E1A26',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  addPhotoTitle: {
    color: '#89FE00',
    fontSize: 14,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewAddImg: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sansRegular,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#89FE00',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#002233',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
});
