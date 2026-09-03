import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { generateMealPlan, IMealPlan, TMealSuggestion } from '@/services/meal-planner-api';

const DIETARY_OPTIONS = ['Balanced', 'Keto', 'High Protein', 'Vegan'];
const CRAVING_OPTIONS = ['Savory', 'Fresh', 'Warm', 'Sweet'];
const PREP_TIME_OPTIONS = ['Any', '< 15m', '30m+'];

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  onLogMeal: (meal: TMealSuggestion) => void;
};

export function AIMealPlannerModal({ visible, onClose, onLogMeal }: Props) {
  const [dietaryFocus, setDietaryFocus] = useState<string>('Balanced');
  const [craving, setCraving] = useState<string>('Savory');
  const [prepTime, setPrepTime] = useState<string>('Any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<IMealPlan | null>(null);

  const prepIndex = Math.max(0, PREP_TIME_OPTIONS.indexOf(prepTime));

  const sliderAnim = useRef(new Animated.Value(prepIndex)).current;
  const sliderWidth = useRef(1);

  useEffect(() => {
    Animated.spring(sliderAnim, {
      toValue: prepIndex,
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [prepIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sliderAnim.stopAnimation();
        sliderAnim.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const valDelta = (gestureState.dx / sliderWidth.current) * 2;
        sliderAnim.setValue(valDelta);
      },
      onPanResponderRelease: () => {
        sliderAnim.flattenOffset();
        sliderAnim.stopAnimation((val) => {
          let snapValue = Math.round(val);
          snapValue = Math.max(0, Math.min(2, snapValue));
          
          Animated.spring(sliderAnim, {
            toValue: snapValue,
            useNativeDriver: false,
            friction: 5,
          }).start();
          
          setPrepTime(PREP_TIME_OPTIONS[snapValue]);
        });
      },
    })
  ).current;

  // Interpolations for custom slider
  const fillWidth = sliderAnim.interpolate({
    inputRange: [0, 2],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const prefsString = `Diet: ${dietaryFocus}, Craving: ${craving}, Prep Time: ${prepTime}`;
      const generatedPlan = await generateMealPlan({ preferences: prefsString });
      setPlan(generatedPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPlan(null);
    setDietaryFocus('Balanced');
    setCraving('Savory');
    setPrepTime('Any');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>✨ AI Meal Planner</Text>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>

          {!plan && !loading ? (
            <ScrollView style={styles.inputContainer} showsVerticalScrollIndicator={false}>
              
              <View style={styles.section}>
                <Text style={styles.label}>DIETARY FOCUS</Text>
                <View style={styles.chipRow}>
                  {DIETARY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      style={[styles.chip, dietaryFocus === opt && styles.chipSelected]}
                      onPress={() => setDietaryFocus(opt)}
                    >
                      <Text style={[styles.chipText, dietaryFocus === opt && styles.chipTextSelected]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>CRAVINGS</Text>
                <View style={styles.chipRow}>
                  {CRAVING_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      style={[styles.chip, craving === opt && styles.chipSelected]}
                      onPress={() => setCraving(opt)}
                    >
                      <Text style={[styles.chipText, craving === opt && styles.chipTextSelected]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>PREP TIME</Text>
                <View style={styles.sliderWrapper}>
                  <View 
                    style={styles.customSliderContainer}
                    onLayout={(e) => {
                      sliderWidth.current = Math.max(1, e.nativeEvent.layout.width);
                    }}
                    {...panResponder.panHandlers}
                  >
                    <View style={styles.sliderTrackBackground} />
                    <Animated.View style={[styles.sliderTrackFill, { width: fillWidth }]} />
                    <View style={styles.sliderSteps}>
                      {PREP_TIME_OPTIONS.map((opt, idx) => (
                        <View key={opt} style={styles.sliderStepDotContainer}>
                          <View style={styles.sliderStepDot} />
                        </View>
                      ))}
                    </View>
                    <Animated.View 
                      style={[
                        styles.sliderThumb, 
                        { 
                          left: sliderAnim.interpolate({
                            inputRange: [0, 2],
                            outputRange: ['0%', '100%'],
                            extrapolate: 'clamp',
                          }),
                          transform: [{ translateX: -12 }]
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    {PREP_TIME_OPTIONS.map((opt) => (
                      <Text 
                        key={opt} 
                        style={[
                          styles.sliderLabelText, 
                          prepTime === opt && styles.sliderLabelTextSelected,
                          opt === '30m+' && { textAlign: 'right' },
                          opt === 'Any' && { textAlign: 'left' }
                        ]}
                      >
                        {opt}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              <Pressable style={styles.generateBtn} onPress={handleGenerate}>
                <Text style={styles.generateBtnText}>Generate Plan</Text>
              </Pressable>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.loadingText}>AI is planning your meals...</Text>
            </View>
          ) : plan ? (
            <ScrollView style={styles.planContainer}>
              <Text style={styles.summary}>{plan.summary}</Text>
              
              <View style={styles.planMacroRow}>
                <View style={styles.planMacroItem}>
                  <Text style={styles.planMacroLabel}>CALORIES</Text>
                  <Text style={styles.planMacroValue}>{plan.totalCalories}</Text>
                </View>
                <View style={styles.planMacroItem}>
                  <Text style={styles.planMacroLabel}>PROTEIN</Text>
                  <Text style={styles.planMacroValue}>{plan.totalProtein}g</Text>
                </View>
                <View style={styles.planMacroItem}>
                  <Text style={styles.planMacroLabel}>CARBS</Text>
                  <Text style={styles.planMacroValue}>{plan.totalCarbs}g</Text>
                </View>
                <View style={styles.planMacroItem}>
                  <Text style={styles.planMacroLabel}>FAT</Text>
                  <Text style={styles.planMacroValue}>{plan.totalFat}g</Text>
                </View>
              </View>
              
              {plan.meals.map((meal, idx) => (
                <View key={idx} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>{meal.mealType}</Text>
                    <Text style={styles.mealCals}>{meal.totalCalories} kcal</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  
                  <View style={styles.mealMacroChips}>
                    <View style={styles.mealMacroChip}>
                      <Text style={styles.mealMacroChipText}>Protein {meal.totalProtein}g</Text>
                    </View>
                    <View style={styles.mealMacroChip}>
                      <Text style={styles.mealMacroChipText}>Carbs {meal.totalCarbs}g</Text>
                    </View>
                    <View style={styles.mealMacroChip}>
                      <Text style={styles.mealMacroChipText}>Fat {meal.totalFat}g</Text>
                    </View>
                  </View>
                  
                  <View style={styles.foodsList}>
                    {meal.foods.map((f, fIdx) => (
                      <View 
                        key={fIdx} 
                        style={[
                          styles.foodRow, 
                          fIdx === meal.foods.length - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <Text style={styles.foodName}>{f.name}</Text>
                        <Text style={styles.foodQty}>{f.quantity}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <Pressable
                    style={styles.logBtn}
                    onPress={() => {
                      onLogMeal(meal);
                      handleClose();
                    }}
                  >
                    <Text style={styles.logBtnText}>Log This Meal</Text>
                  </Pressable>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111315', // Matching the dark background of the image
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: '65%',
    maxHeight: '92%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.outline,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: '#A0A0A0',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#333', // Subtle border
    backgroundColor: '#1E1E1E', // Dark chip background
  },
  chipSelected: {
    backgroundColor: '#7AD3FF', // Light blue from design
    borderColor: '#7AD3FF',
    shadowColor: '#7AD3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  chipText: {
    fontSize: 15,
    fontFamily: F.sansMedium,
    color: '#E0E0E0',
  },
  chipTextSelected: {
    color: '#000000', // Dark text on light blue
    fontFamily: F.sansSemiBold,
  },
  generateBtn: {
    backgroundColor: '#7AD3FF', // Light blue from design
    borderRadius: 999,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  generateBtnText: {
    color: '#000000', // Dark text
    fontFamily: F.sansBold,
    fontSize: 17,
  },
  sliderWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  customSliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    backgroundColor: '#7AD3FF',
    borderRadius: 4,
  },
  sliderSteps: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  sliderStepDotContainer: {
    width: 24,
    alignItems: 'center',
  },
  sliderStepDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7AD3FF',
    shadowColor: '#7AD3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 14,
    fontFamily: F.sansMedium,
    color: '#A0A0A0',
    flex: 1,
    textAlign: 'center',
  },
  sliderLabelTextSelected: {
    color: '#E0E0E0',
    fontFamily: F.sansBold,
  },
  errorText: {
    color: C.error,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: F.sans,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: C.onSurfaceVariant,
    fontFamily: F.sans,
    fontSize: 16,
  },
  planContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  summary: {
    color: C.onSurfaceVariant,
    fontFamily: F.sans,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  planMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginBottom: 24,
  },
  planMacroItem: {
    alignItems: 'center',
  },
  planMacroLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  planMacroValue: {
    color: '#7AD3FF',
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  mealCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealMacroChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  mealMacroChip: {
    backgroundColor: 'rgba(122, 211, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(122, 211, 255, 0.15)',
  },
  mealMacroChipText: {
    color: '#7AD3FF',
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
  mealCals: {
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
    backgroundColor: C.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealName: {
    fontSize: 18,
    fontFamily: F.sansBold,
    color: C.onSurface,
    marginBottom: 12,
  },
  foodsList: {
    marginBottom: 16,
    backgroundColor: C.background,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  foodName: {
    fontSize: 15,
    fontFamily: F.sans,
    color: '#E0E0E0',
    flex: 1,
  },
  foodQty: {
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    color: '#A0A0A0',
    marginLeft: 16,
  },
  logBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logBtnText: {
    color: C.onPrimary,
    fontFamily: F.sansBold,
    fontSize: 15,
  },
});
