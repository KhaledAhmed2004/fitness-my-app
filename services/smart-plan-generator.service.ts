import { PlanRepository } from '@/repositories/plan.repository';
import { ExerciseRepository } from '@/repositories/exercise.repository';

export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Kettlebell' | 'Machine' | 'Cable' | 'Bodyweight';
export type FitnessGoal = 'HYPERTROPHY' | 'STRENGTH' | 'FAT_LOSS';

export interface SmartPlanParams {
  equipment: EquipmentType[];
  goal: FitnessGoal;
  daysPerWeek: 3 | 4 | 5;
  customPlanName?: string;
}

interface MuscleTargetConfig {
  label: string;
  weekday: number; // 0=Mon..6=Sun
  muscleGroups: ('chest' | 'back' | 'shoulder' | 'triceps' | 'biceps' | 'legs' | 'abs')[];
}

export const SmartPlanGeneratorService = {
  /**
   * Generates a fully custom workout plan tailored 100% to the user's available equipment
   */
  async generateAndActivatePlan(params: SmartPlanParams): Promise<string> {
    const allExercises = await ExerciseRepository.getAllExercises();

    // Ensure Bodyweight is always available as a safe fallback
    const selectedGear = new Set<string>(params.equipment);
    selectedGear.add('Bodyweight');

    // 1. Determine Split Structure based on Days Per Week
    const daysConfig: MuscleTargetConfig[] = [];

    if (params.daysPerWeek === 3) {
      daysConfig.push(
        { label: 'Push Day (Chest, Shoulders & Triceps)', weekday: 0, muscleGroups: ['chest', 'shoulder', 'triceps'] },
        { label: 'Pull Day (Back, Lats & Biceps)', weekday: 2, muscleGroups: ['back', 'biceps'] },
        { label: 'Legs & Core (Quads, Glutes & Abs)', weekday: 4, muscleGroups: ['legs', 'abs'] }
      );
    } else if (params.daysPerWeek === 4) {
      daysConfig.push(
        { label: 'Upper Body A (Power & Heavy)', weekday: 0, muscleGroups: ['chest', 'back', 'shoulder', 'triceps', 'biceps'] },
        { label: 'Lower Body A (Quad & Glute Focus)', weekday: 1, muscleGroups: ['legs', 'abs'] },
        { label: 'Upper Body B (Hypertrophy & Pump)', weekday: 3, muscleGroups: ['back', 'chest', 'shoulder', 'biceps', 'triceps'] },
        { label: 'Lower Body B (Hamstrings & Calves)', weekday: 4, muscleGroups: ['legs', 'abs'] }
      );
    } else {
      // 5 Days Split
      daysConfig.push(
        { label: 'Chest & Triceps Focus', weekday: 0, muscleGroups: ['chest', 'triceps'] },
        { label: 'Back & Biceps Focus', weekday: 1, muscleGroups: ['back', 'biceps'] },
        { label: 'Shoulders & Delts Focus', weekday: 2, muscleGroups: ['shoulder', 'abs'] },
        { label: 'Legs & Lower Body Mastery', weekday: 4, muscleGroups: ['legs'] },
        { label: 'Full Body Athletic Pump', weekday: 5, muscleGroups: ['chest', 'back', 'legs', 'abs'] }
      );
    }

    // 2. Goal Reps/Sets Presets
    let defaultSets = 3;
    let defaultReps = 10;
    let restSecs = 90;
    let targetRpe = 8.0;

    if (params.goal === 'STRENGTH') {
      defaultSets = 4;
      defaultReps = 6;
      restSecs = 120;
      targetRpe = 8.5;
    } else if (params.goal === 'FAT_LOSS') {
      defaultSets = 3;
      defaultReps = 14;
      restSecs = 60;
      targetRpe = 7.5;
    }

    // 3. Build Plan Title & Description
    const equipmentLabel = params.equipment.length === 1 && params.equipment[0] === 'Bodyweight'
      ? 'Calisthenics (Bodyweight)'
      : params.equipment.includes('Barbell') && params.equipment.includes('Dumbbell')
      ? 'Hybrid Free-Weights'
      : params.equipment.includes('Dumbbell')
      ? 'Dumbbell Only'
      : 'Custom Gear';

    const planName = params.customPlanName || `${params.daysPerWeek}-Day ${equipmentLabel} ${params.goal === 'HYPERTROPHY' ? 'Hypertrophy' : params.goal === 'STRENGTH' ? 'Strength' : 'Conditioning'}`;
    const planDescription = `Tailored for ${params.equipment.join(', ')}. Optimized for ${params.goal.toLowerCase()} with ${params.daysPerWeek} training sessions per week.`;

    // 4. Insert Master Plan
    const planId = await PlanRepository.createPlan(
      planName,
      planDescription,
      params.goal,
      params.daysPerWeek
    );

    // 5. Build Days & Assign Filtered Exercises
    for (let dayIndex = 0; dayIndex < daysConfig.length; dayIndex++) {
      const config = daysConfig[dayIndex];
      const targetMuscleString = config.muscleGroups.join(',');

      const dayId = await PlanRepository.addDayToPlan(
        planId,
        config.label,
        config.weekday,
        targetMuscleString,
        dayIndex
      );

      // Filter available exercises for this day's target muscles that match user's equipment
      const dayExercises: string[] = [];

      for (const muscle of config.muscleGroups) {
        // Find matching exercises in DB
        const matchCandidates = allExercises.filter((ex) => {
          const muscleGroup = (ex.muscle_group || '').toLowerCase();
          const name = (ex.name || '').toLowerCase();
          const equipment = ex.equipment || 'Bodyweight';

          const muscleMatches = muscleGroup.includes(muscle) ||
            (muscle === 'triceps' && (name.includes('tricep') || name.includes('dip') || name.includes('pushdown'))) ||
            (muscle === 'biceps' && (name.includes('curl') || name.includes('chin'))) ||
            (muscle === 'shoulder' && (muscleGroup.includes('shoulder') || name.includes('press') || name.includes('raise'))) ||
            (muscle === 'abs' && (muscleGroup.includes('core') || muscleGroup.includes('abs') || name.includes('plank') || name.includes('raise')));

          const equipmentMatches = selectedGear.has(equipment);
          return muscleMatches && equipmentMatches && !dayExercises.includes(ex.id);
        });

        if (matchCandidates.length > 0) {
          dayExercises.push(matchCandidates[0].id);
          if (matchCandidates.length > 1 && dayExercises.length < 6) {
            dayExercises.push(matchCandidates[1].id);
          }
        } else {
          // Fallback: search any bodyweight or available exercise for this muscle group
          const fallbackCandidates = allExercises.filter((ex) => {
            const muscleGroup = (ex.muscle_group || '').toLowerCase();
            return muscleGroup.includes(muscle) && !dayExercises.includes(ex.id);
          });
          if (fallbackCandidates.length > 0) {
            dayExercises.push(fallbackCandidates[0].id);
          }
        }
      }

      // Add selected exercises to this day (up to 5-6 per workout)
      const selectedForDay = dayExercises.slice(0, 6);
      for (let exIndex = 0; exIndex < selectedForDay.length; exIndex++) {
        await PlanRepository.addExerciseToDay(
          dayId,
          selectedForDay[exIndex],
          defaultSets,
          defaultReps,
          targetRpe,
          restSecs,
          exIndex + 1
        );
      }
    }

    // 6. Set as Active Plan
    await PlanRepository.activatePlan(planId);

    return planId;
  },
};
