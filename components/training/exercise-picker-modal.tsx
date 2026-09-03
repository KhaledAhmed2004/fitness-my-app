import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { ExerciseRepository } from '@/repositories/exercise.repository';
import { Exercise } from '@/repositories/workout.repository';
import { ExerciseConfigModal } from './exercise-config-modal';
import * as Haptics from 'expo-haptics';

const C = Vital.colors;
const F = Vital.fonts;

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseIds: string[]) => void;
}

export function ExercisePickerModal({ visible, onClose, onSelect }: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [configExercise, setConfigExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible, searchQuery]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim().length > 0) {
        const results = await ExerciseRepository.searchExercises(searchQuery.trim());
        setExercises(results);
      } else {
        const results = await ExerciseRepository.getAllExercises();
        setExercises(results);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (selectedIds.size > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(Array.from(selectedIds));
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIds(new Set());
    onClose();
  };

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const equipmentFilters = ['All Gear', 'Dumbbell', 'Barbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'];
  const [selectedEquipment, setSelectedEquipment] = useState('All Gear');

  const filteredExercises = exercises.filter(ex => {
    const matchesCategory = selectedCategory === 'All' ? true : ex.muscle_group?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesEquipment = selectedEquipment === 'All Gear' ? true : ex.equipment?.toLowerCase() === selectedEquipment.toLowerCase();
    return matchesCategory && matchesEquipment;
  });

  const renderItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Pressable onPress={() => toggleSelection(item.id)}>
        {({ pressed }) => (
          <View style={[
            styles.exerciseRow, 
            pressed && styles.exerciseRowPressed,
            isSelected && styles.exerciseRowSelected
          ]}>
            <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
              <MaterialIcons name="fitness-center" size={24} color={isSelected ? C.background : C.trainingAccent} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.exerciseName, isSelected && { color: C.trainingAccent }]}>{item.name}</Text>
              <Text style={styles.exerciseTags}>
                {item.muscle_group || 'Any'} • {item.equipment || 'Any'}
              </Text>
            </View>
            <Pressable 
              style={styles.configBtn}
              onPress={(e) => {
                e.stopPropagation();
                setConfigExercise(item);
              }}
            >
              <MaterialIcons name="settings" size={20} color={C.onSurfaceVariant} />
            </Pressable>
            <View style={[styles.addButton, isSelected && styles.addButtonSelected]}>
              <MaterialIcons name={isSelected ? "check" : "add"} size={24} color={isSelected ? C.background : C.trainingAccent} />
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Exercise</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={22} color={C.onSurfaceVariant} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={C.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn} hitSlop={10}>
                <MaterialIcons name="cancel" size={20} color={C.outline} />
              </Pressable>
            )}
          </View>

          <View style={styles.categoriesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable 
                    key={cat} 
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Equipment Filter Strip */}
          <View style={[styles.categoriesWrapper, { marginTop: 4, marginBottom: 8 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
              {equipmentFilters.map(eq => {
                const isActive = selectedEquipment === eq;
                return (
                  <Pressable 
                    key={eq} 
                    style={[
                      styles.equipmentPill, 
                      isActive && styles.equipmentPillActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedEquipment(eq);
                    }}
                  >
                    <Text style={[styles.equipmentText, isActive && styles.equipmentTextActive]}>{eq}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.trainingAccent} />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={48} color={C.outlineVariant} />
                  <Text style={styles.emptyTitle}>No exercises found</Text>
                  <Text style={styles.emptySubtitle}>Try searching for a different name</Text>
                </View>
              }
            />
          )}

          {selectedIds.size > 0 && (
            <View style={styles.footer}>
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>
                  Add {selectedIds.size} {selectedIds.size === 1 ? 'Exercise' : 'Exercises'}
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      <ExerciseConfigModal 
        visible={!!configExercise} 
        exercise={configExercise} 
        onClose={() => setConfigExercise(null)} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: F.sansExtraBold,
    fontSize: 28,
    color: C.onSurface,
    letterSpacing: -0.5,
  },
  closeBtn: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 15,
    color: C.trainingAccent,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurface,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  categoriesWrapper: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  categoryText: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  categoryTextActive: {
    color: C.trainingAccent,
    fontFamily: F.sansSemiBold,
  },
  equipmentPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 6,
  },
  equipmentPillActive: {
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    borderColor: '#C8F135',
  },
  equipmentText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  equipmentTextActive: {
    color: '#C8F135',
    fontFamily: F.sansBold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  exerciseRowPressed: {
    backgroundColor: C.surfaceHigh,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.onSurface,
    marginBottom: 4,
  },
  exerciseTags: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  configBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 15,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  exerciseRowSelected: {
    borderColor: C.trainingAccent,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
  },
  iconBoxSelected: {
    backgroundColor: C.trainingAccent,
  },
  addButtonSelected: {
    backgroundColor: C.trainingAccent,
    borderColor: C.trainingAccent,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: C.background,
  },
  confirmBtn: {
    backgroundColor: C.trainingAccent,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.trainingAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.background,
  }
});
