/**
 * Trainer Store — State Management for Trainer Business, Client CRM, PAR-Q+ Injury Shield & Scheduler
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type {
  TrainerProfile,
  TrainerAppointmentSlot,
  TrainerCertification,
  ClientTransformation,
  AppointmentStatus,
  AthleteClientDossier,
  ClientInjuryRecord,
  PtPackageInfo,
  PtPaymentRecord,
  PaymentMethod,
  ClientProgressPhoto,
  ProgramSplit,
  AssignedProgram,
  CustomCoachingPackage,
  CoachDietPlan,
  AssignedDietPlan,
  PrescribedMeal,
  PrescribedSupplement,
} from '@/types/trainer';

const TRAINER_STORAGE_KEY = 'vital_trainer_coach_master_v2';

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

const SEED_CERTIFICATIONS: TrainerCertification[] = [
  {
    id: 'cert_1',
    title: 'Certified Strength & Conditioning Specialist (CSCS)',
    issuer: 'NSCA',
    issuerFull: 'National Strength and Conditioning Association (USA)',
    credentialId: 'NSCA-CSCS-2024-88910',
    issueDate: '2021-04-15',
    expiryDate: '2027-12-31',
    badgeCode: 'CSCS',
    verified: true,
    color: '#FFB800',
    bg: 'rgba(255, 184, 0, 0.15)',
    description: 'Gold-standard accreditation for collegiate & elite professional athlete strength coaching.',
  },
  {
    id: 'cert_2',
    title: 'ACE Certified Personal Trainer',
    issuer: 'ACE',
    issuerFull: 'American Council on Exercise',
    credentialId: 'ACE-CPT-749201',
    issueDate: '2019-08-20',
    expiryDate: '2026-08-31',
    badgeCode: 'ACE',
    verified: true,
    color: '#00B4D8',
    bg: 'rgba(0, 180, 216, 0.15)',
    description: 'Integrated fitness training model, postural correction, functional movement screening.',
  },
  {
    id: 'cert_3',
    title: 'ISSA Master Fitness & Nutrition Specialist',
    issuer: 'ISSA',
    issuerFull: 'International Sports Sciences Association',
    credentialId: 'ISSA-MN-99238',
    issueDate: '2022-01-10',
    expiryDate: '2028-01-10',
    badgeCode: 'ISSA',
    verified: true,
    color: '#89FE00',
    bg: 'rgba(137, 254, 0, 0.15)',
    description: 'Specialized in advanced hypertrophy mesocycles, metabolic rate calculations, and contest diet.',
  },
  {
    id: 'cert_4',
    title: 'Red Cross First Aid & CPR/AED Certified',
    issuer: 'RED_CROSS',
    issuerFull: 'Bangladesh Red Crescent / American Red Cross',
    credentialId: 'RC-CPR-2025-1102',
    issueDate: '2025-02-01',
    expiryDate: '2027-02-01',
    badgeCode: 'CPR',
    verified: true,
    color: '#FF5C5C',
    bg: 'rgba(255, 92, 92, 0.15)',
    description: 'Emergency response, automated external defibrillator operation, acute trauma on gym floor.',
  },
];

const SEED_TRANSFORMATIONS: ClientTransformation[] = [
  {
    id: 'trans_1',
    clientName: 'Khaled Nayeem',
    age: 26,
    startingWeightKg: 84.5,
    currentWeightKg: 72.0,
    durationWeeks: 14,
    programName: '12-Week Lean Hypertrophy & Fat Cut',
    muscleGainKg: 4.2,
    bodyFatLossPercent: 9.5,
    story: 'Dropped from 24% to 14.5% body fat while increasing squat from 80kg to 125kg. Fixed knee tracking with coach cues.',
    verified: true,
    tag: 'FAT LOSS & ATHLETIC',
  },
  {
    id: 'trans_2',
    clientName: 'Tanvir Ahmed',
    age: 29,
    startingWeightKg: 68.0,
    currentWeightKg: 76.5,
    durationWeeks: 20,
    programName: 'Upper/Lower Pure Hypertrophy Protocol',
    muscleGainKg: 8.5,
    bodyFatLossPercent: 1.2,
    story: 'Added 8.5kg of solid lean muscle mass over 5 months. Overhead press increased by 22.5kg with zero shoulder pain.',
    verified: true,
    tag: 'MASS MONSTER',
  },
  {
    id: 'trans_3',
    clientName: 'Sifat Karim',
    age: 34,
    startingWeightKg: 92.0,
    currentWeightKg: 75.0,
    durationWeeks: 24,
    programName: 'Spine Rehab & Recomposition',
    muscleGainKg: 3.8,
    bodyFatLossPercent: 12.0,
    story: 'Overcame L4-L5 disc herniation under Coach Alex with belt squats and core bracing. 17kg lost with medical clearance.',
    verified: true,
    tag: 'REHAB & LIFESTYLE',
  },
];

const SEED_CLIENTS: AthleteClientDossier[] = [
  {
    id: 'usr_client_1',
    name: 'Khaled Nayeem',
    email: 'khaled@demo.com',
    phone: '+880 1712-345678',
    age: 26,
    gender: 'MALE',
    goal: 'FAT_LOSS',
    currentPhase: 'Week 6: Caloric Deficit & Conditioning',
    startingWeightKg: 84.5,
    currentWeightKg: 72.0,
    targetWeightKg: 70.0,
    bodyFatPercent: 14.2,
    notes: 'High adherence to 180g protein target. Highly motivated for half-marathon conditioning.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: true,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      physicianName: 'Dr. A. K. Azad (Sports Medicine)',
      emergencyContact: {
        name: 'Mrs. Nayeem',
        phone: '+880 1711-223344',
        relation: 'Mother',
      },
    },
    injuries: [
      {
        id: 'inj_1',
        jointOrArea: 'Left Knee Patellar Tendinopathy',
        severity: 'MILD',
        contraindicatedMovements: ['Deep Barbell Back Squats (<90 deg)', 'Heavy Leg Extensions (Top Lockout)'],
        safeAlternatives: ['Box Squats to Parallel', 'Spanish Squats (Band-Supported)', 'Romanian Deadlifts'],
        notes: 'Needs 5-minute quad tendon warm-up and foam rolling prior to lower body compound sets.',
      },
    ],
    package: {
      packageType: 'MONTHLY_12',
      totalSessions: 12,
      completedSessions: 8,
      remainingSessions: 4,
      startDate: '2026-08-01',
      expiryDate: '2026-09-15',
      priceBdt: 15000,
      isPaid: true,
      attendanceHistory: [
        { id: 'att_1', date: '2026-08-03', timeSlot: '07:00 AM', topic: 'Squat Biomechanics & Baseline Sets' },
        { id: 'att_2', date: '2026-08-06', timeSlot: '07:00 AM', topic: 'Incline Bench & Upper Hypertrophy' },
        { id: 'att_3', date: '2026-08-10', timeSlot: '07:00 AM', topic: 'Trap Bar Deadlift Pulls' },
        { id: 'att_4', date: '2026-08-13', timeSlot: '07:00 AM', topic: 'Shoulder Delts & Arms Hypertrophy' },
        { id: 'att_5', date: '2026-08-17', timeSlot: '07:00 AM', topic: 'Leg Day: Box Squats & Hamstrings' },
        { id: 'att_6', date: '2026-08-20', timeSlot: '07:00 AM', topic: 'Chest & Back Superset Density' },
        { id: 'att_7', date: '2026-08-24', timeSlot: '07:00 AM', topic: 'HIIT Sled Pushes & Core Stability' },
        { id: 'att_8', date: '2026-08-27', timeSlot: '07:00 AM', topic: 'Progressive Overload Assessment' },
      ],
      paymentLog: [
        { id: 'pay_1', date: '2026-08-01', amountBdt: 15000, method: 'bKash', transactionId: '9A8B7C6D5E', note: 'Full Package Payment via bKash' },
      ],
    },
    progressPhotos: [
      { id: 'photo_1a', date: '2026-08-01', label: 'Day 1 Baseline', uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600', weightAtTime: 84.5, bodyFatAtTime: 24.0, notes: 'Initial posture & waist assessment' },
      { id: 'photo_1b', date: '2026-08-27', label: 'Week 4 Cut Check-in', uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', weightAtTime: 72.0, bodyFatAtTime: 14.2, notes: 'Visible core definition & shoulder width' },
    ],
  },
  {
    id: 'usr_client_2',
    name: 'Tanvir Ahmed',
    email: 'tanvir@gym.demo',
    phone: '+880 1819-876543',
    age: 29,
    gender: 'MALE',
    goal: 'HYPERTROPHY',
    currentPhase: 'Week 4: Chest & Delts Accumulation Block',
    startingWeightKg: 68.0,
    currentWeightKg: 76.5,
    targetWeightKg: 80.0,
    bodyFatPercent: 12.8,
    notes: 'Eating 3,200 kcal surplus. High response to 8-12 rep range on upper push days.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: true,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      emergencyContact: {
        name: 'Kabir Ahmed',
        phone: '+880 1811-334455',
        relation: 'Brother',
      },
    },
    injuries: [
      {
        id: 'inj_2',
        jointOrArea: 'Right Subacromial Shoulder Impingement',
        severity: 'MODERATE',
        contraindicatedMovements: ['Behind-Neck Overhead Press', 'Upright Barbell Rows', 'Wide-Grip Dips'],
        safeAlternatives: ['Neutral-Grip DB Shoulder Press', 'Landmine Press', 'Chest-Supported Incline Row'],
        notes: 'Ensure rotator cuff external rotation warm-up with light cable bands.',
      },
    ],
    package: {
      packageType: 'TRANSFORMATION_24',
      totalSessions: 24,
      completedSessions: 14,
      remainingSessions: 10,
      startDate: '2026-07-01',
      expiryDate: '2026-10-15',
      priceBdt: 26000,
      isPaid: true,
      attendanceHistory: [
        { id: 'att_t1', date: '2026-08-25', timeSlot: '08:30 AM', topic: 'Incline Bench Press Overload' },
        { id: 'att_t2', date: '2026-08-28', timeSlot: '08:30 AM', topic: 'Lat Pulldown & Bicep Peak' },
      ],
      paymentLog: [
        { id: 'pay_2a', date: '2026-07-01', amountBdt: 13000, method: 'Cash', note: '1st Installment (Cash at Gym Desk)' },
        { id: 'pay_2b', date: '2026-08-01', amountBdt: 13000, method: 'Nagad', transactionId: 'NGD4432190', note: 'Final Installment via Nagad' },
      ],
    },
    progressPhotos: [
      { id: 'photo_2a', date: '2026-07-01', label: 'Day 1 Baseline', uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', weightAtTime: 68.0, bodyFatAtTime: 11.5, notes: 'Starting lean bulk' },
      { id: 'photo_2b', date: '2026-08-28', label: 'Week 8 Hypertrophy', uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600', weightAtTime: 76.5, bodyFatAtTime: 12.8, notes: 'Chest & lat width noticeable gain' },
    ],
  },
  {
    id: 'usr_client_3',
    name: 'Sifat Karim',
    email: 'sifat@gym.demo',
    phone: '+880 1912-334455',
    age: 34,
    gender: 'MALE',
    goal: 'REHAB',
    currentPhase: 'Week 8: Posterior Chain Core Stabilization',
    startingWeightKg: 92.0,
    currentWeightKg: 75.0,
    targetWeightKg: 74.0,
    bodyFatPercent: 16.5,
    notes: 'Undergoing active spine stabilization. Zero lower back pain in the past 4 weeks.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: true,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      physicianName: 'Dr. Rafiqul Islam (Neuro-Spine Orthopedic)',
      emergencyContact: {
        name: 'Sadia Karim',
        phone: '+880 1911-556677',
        relation: 'Spouse',
      },
    },
    injuries: [
      {
        id: 'inj_3',
        jointOrArea: 'Lumbar Spine L4-L5 Disc Herniation',
        severity: 'SEVERE_CONTRAINDICATED',
        contraindicatedMovements: ['Heavy Axial Barbell Back Squats', 'Conventional Deadlift from Floor', 'Seated Weighted Spinal Flexion'],
        safeAlternatives: ['Belt Squats', 'Trap Bar Deadlifts (High Handle)', '45-Degree Hyperextensions', 'McGill Big 3 Core Protocol'],
        notes: 'Strictly avoid spinal flexion under load. Always verify abdominal bracing before working sets.',
      },
    ],
    package: {
      packageType: 'MONTHLY_12',
      totalSessions: 12,
      completedSessions: 6,
      remainingSessions: 6,
      startDate: '2026-08-10',
      expiryDate: '2026-09-25',
      priceBdt: 15000,
      isPaid: true,
      attendanceHistory: [
        { id: 'att_s1', date: '2026-08-22', timeSlot: '10:00 AM', topic: 'McGill Core & Belt Squat Calibration' },
        { id: 'att_s2', date: '2026-08-26', timeSlot: '10:00 AM', topic: 'Trap Bar Deadlift High Handle Form' },
      ],
      paymentLog: [
        { id: 'pay_3', date: '2026-08-10', amountBdt: 15000, method: 'bKash', transactionId: 'BK99001122', note: 'Spine Rehab Coaching 12-Pack' },
      ],
    },
    progressPhotos: [],
  },
  {
    id: 'usr_client_4',
    name: 'Ayesha Rahman',
    email: 'ayesha@gym.demo',
    phone: '+880 1611-998877',
    age: 24,
    gender: 'FEMALE',
    goal: 'ATHLETIC_CONDITIONING',
    currentPhase: 'Week 5: Glute Hypertrophy & VO2 Intervals',
    startingWeightKg: 65.0,
    currentWeightKg: 58.0,
    targetWeightKg: 56.0,
    bodyFatPercent: 21.0,
    notes: 'Kettlebell snatch and hip thrust champion. Carries fast-acting inhaler in gym bag.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: false,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      emergencyContact: {
        name: 'Dr. Tariq Rahman',
        phone: '+880 1611-001122',
        relation: 'Father',
      },
    },
    injuries: [],
    package: {
      packageType: 'MONTHLY_12',
      totalSessions: 12,
      completedSessions: 10,
      remainingSessions: 2,
      startDate: '2026-07-20',
      expiryDate: '2026-09-05',
      priceBdt: 15000,
      isPaid: true,
      attendanceHistory: [],
      paymentLog: [
        { id: 'pay_4', date: '2026-07-20', amountBdt: 15000, method: 'bKash', transactionId: 'BK77889900' },
      ],
    },
    progressPhotos: [],
  },
  {
    id: 'usr_client_5',
    name: 'Fahim Morshed',
    email: 'fahim@gym.demo',
    phone: '+880 1511-778899',
    age: 28,
    gender: 'MALE',
    goal: 'POWERLIFTING',
    currentPhase: 'Week 9: Peaking Block for 180kg Deadlift',
    startingWeightKg: 78.0,
    currentWeightKg: 84.0,
    targetWeightKg: 85.0,
    bodyFatPercent: 15.0,
    notes: 'Aiming for 200kg deadlift by December. Strong core bracing.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: false,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      emergencyContact: {
        name: 'Mrs. Morshed',
        phone: '+880 1511-112233',
        relation: 'Mother',
      },
    },
    injuries: [],
    package: {
      packageType: 'TRANSFORMATION_24',
      totalSessions: 24,
      completedSessions: 23,
      remainingSessions: 1,
      startDate: '2026-06-15',
      expiryDate: '2026-09-30',
      priceBdt: 26000,
      isPaid: true,
      attendanceHistory: [],
      paymentLog: [
        { id: 'pay_5', date: '2026-06-15', amountBdt: 26000, method: 'Bank', transactionId: 'EBL-TRX-5544', note: 'Annual Powerlifting Prep' },
      ],
    },
    progressPhotos: [],
  },
  {
    id: 'usr_client_6',
    name: 'Nusrat Jahan',
    email: 'nusrat@gym.demo',
    phone: '+880 1733-445566',
    age: 31,
    gender: 'FEMALE',
    goal: 'FAT_LOSS',
    currentPhase: 'Week 1: Baseline Movement Screening & Habits',
    startingWeightKg: 74.0,
    currentWeightKg: 73.5,
    targetWeightKg: 62.0,
    bodyFatPercent: 28.5,
    notes: 'New joiner. Learning basic hinge and squat motor patterns.',
    status: 'ACTIVE',
    parQ: {
      hasHeartCondition: false,
      hasChestPainDuringExercise: false,
      hasDizzinessOrLossOfConsciousness: false,
      hasBoneOrJointProblem: false,
      isTakingBloodPressureMeds: false,
      medicalClearanceApproved: true,
      emergencyContact: {
        name: 'Mahmudul Hasan',
        phone: '+880 1733-000111',
        relation: 'Spouse',
      },
    },
    injuries: [],
    package: {
      packageType: 'MONTHLY_12',
      totalSessions: 12,
      completedSessions: 2,
      remainingSessions: 10,
      startDate: '2026-08-25',
      expiryDate: '2026-10-10',
      priceBdt: 15000,
      isPaid: true,
      attendanceHistory: [],
      paymentLog: [
        { id: 'pay_6', date: '2026-08-25', amountBdt: 15000, method: 'Cash', note: 'Paid at desk on onboarding day' },
      ],
    },
    progressPhotos: [],
  },
];

const SEED_PROFILE: TrainerProfile = {
  id: 'usr_demo_trainer',
  name: 'Coach Alex (Gym Trainer)',
  email: 'trainer@gym.com',
  phone: '+880 1711-002233',
  bio: 'Certified CSCS & ACE Strength Coach specializing in athletic hypertrophy, body recomposition, and spine-safe rehab mechanics.',
  gymAffiliation: "Gold's Gym Elite — Dhanmondi / Gulshan",
  yearsOfExperience: 8,
  totalClientsCoached: 340,
  activeClientsCount: 6,
  specialties: [
    'Hypertrophy & Mass Building',
    'Body Recomposition (Fat Loss)',
    'Spine & Knee Injury Rehab',
    'Powerlifting Mechanics',
  ],
  certifications: SEED_CERTIFICATIONS,
  transformations: SEED_TRANSFORMATIONS,
  pricingRates: {
    singleSessionRateBdt: 1500,
    monthlyPackage12Bdt: 15000,
    monthlyPackage24Bdt: 26000,
  },
  rating: {
    average: 4.95,
    reviewCount: 88,
  },
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const SEED_APPOINTMENTS: TrainerAppointmentSlot[] = [
  // MORNING BLOCK
  {
    id: 'slot_1',
    clientId: 'usr_client_1',
    clientName: 'Khaled Nayeem',
    clientPhone: '+880 1712-345678',
    date: getTodayString(),
    timeSlot: '07:00 AM - 08:00 AM',
    period: 'MORNING',
    sessionType: '1_ON_1_PT',
    targetFocus: 'Box Squat Overload & Leg Hypertrophy (Patellar Safe)',
    status: 'COMPLETED',
    attendancePunchedAt: '07:02 AM',
    sessionNotes: 'Completed 4x8 Box Squats @ 90kg with zero patellar knee pain. RIR 2.',
    completedExercises: ['Box Squats', 'Romanian Deadlifts', 'Spanish Squats'],
  },
  {
    id: 'slot_2',
    clientId: 'usr_client_2',
    clientName: 'Tanvir Ahmed',
    clientPhone: '+880 1819-876543',
    date: getTodayString(),
    timeSlot: '08:30 AM - 09:30 AM',
    period: 'MORNING',
    sessionType: '1_ON_1_PT',
    targetFocus: 'Neutral Grip Incline Bench & Chest Hypertrophy',
    status: 'SCHEDULED',
    sessionNotes: 'Focus on neutral dumbbell grip to avoid shoulder subacromial pinch.',
  },
  {
    id: 'slot_3',
    clientId: 'usr_client_3',
    clientName: 'Sifat Karim',
    clientPhone: '+880 1912-334455',
    date: getTodayString(),
    timeSlot: '10:00 AM - 11:00 AM',
    period: 'MORNING',
    sessionType: 'ASSESSMENT',
    targetFocus: 'Monthly Body Composition & Spine Core Testing',
    status: 'SCHEDULED',
    sessionNotes: 'Check McGill curl-up endurance and tape measurements.',
  },

  // EVENING BLOCK
  {
    id: 'slot_4',
    clientId: 'usr_client_4',
    clientName: 'Ayesha Rahman',
    clientPhone: '+880 1611-998877',
    date: getTodayString(),
    timeSlot: '05:30 PM - 06:30 PM',
    period: 'EVENING',
    sessionType: '1_ON_1_PT',
    targetFocus: 'Glute Hypertrophy & Kettlebell Conditioning',
    status: 'SCHEDULED',
    sessionNotes: 'Hip thrusts 4x10, Bulgarian split squats. Inhaler handy.',
  },
  {
    id: 'slot_5',
    clientId: 'usr_client_5',
    clientName: 'Fahim Morshed',
    clientPhone: '+880 1511-778899',
    date: getTodayString(),
    timeSlot: '07:30 PM - 08:30 PM',
    period: 'EVENING',
    sessionType: 'FORM_CHECK',
    targetFocus: 'Deadlift Lumbar Alignment & Lat Engagement',
    status: 'SCHEDULED',
    sessionNotes: 'Review cues for neutral spine and bar path on 140kg pulls.',
  },
];

export const SEED_PROGRAMS: ProgramSplit[] = [
  {
    id: 'split_ppl',
    code: 'PPL',
    title: 'Push / Pull / Legs Hypertrophy',
    subtitle: '6-Day High-Frequency Muscle Hypertrophy Mesocycle',
    durationWeeks: 8,
    daysPerWeek: 6,
    level: 'ADVANCED',
    goal: 'Hypertrophy',
    color: '#FFB800',
    bg: 'rgba(255, 184, 0, 0.15)',
    description: 'Gold-standard double-split targeting mechanical tension, metabolic stress, and complete upper/lower muscle stimulus with 2x frequency per week.',
    days: [
      {
        id: 'ppl_d1',
        dayNumber: 1,
        title: 'Push A: Heavy Clavicular & Triceps',
        focus: 'Chest, Front/Side Delts, Triceps Overload',
        exercises: [
          { id: 'e1', name: 'Incline Barbell Bench Press', targetMuscle: 'Upper Chest', sets: 4, reps: '6-8', rpe: 8.5, tempo: '3-1-1-0', restSeconds: 120, notes: 'Focus on 30° incline and sternal contraction.' },
          { id: 'e2', name: 'Flat Dumbbell Press', targetMuscle: 'Mid Chest', sets: 3, reps: '8-10', rpe: 8, tempo: '3-0-1-0', restSeconds: 90, notes: 'Full stretch at bottom, squeeze at peak.' },
          { id: 'e3', name: 'Standing DB Lateral Raises', targetMuscle: 'Lateral Deltoids', sets: 4, reps: '12-15', rpe: 9, tempo: '2-0-1-1', restSeconds: 60, notes: 'Strict form, slight forward lean.' },
          { id: 'e4', name: 'Overhead Cable Rope Extension', targetMuscle: 'Triceps Long Head', sets: 3, reps: '10-12', rpe: 8.5, tempo: '3-0-1-0', restSeconds: 75, notes: 'Elbows tucked, deep stretch.' },
        ],
      },
      {
        id: 'ppl_d2',
        dayNumber: 2,
        title: 'Pull A: Lat Width & Biceps Thickness',
        focus: 'Upper Back, Latissimus Dorsi, Rear Delts, Biceps',
        exercises: [
          { id: 'e5', name: 'Chest-Supported Neutral Row', targetMuscle: 'Upper Lats & Rhomboids', sets: 4, reps: '8-10', rpe: 8, tempo: '3-1-1-1', restSeconds: 90, notes: 'Squeeze scapulae for 1 full second.' },
          { id: 'e6', name: 'Neutral-Grip Lat Pulldown', targetMuscle: 'Lats Width', sets: 3, reps: '10-12', rpe: 8.5, tempo: '3-0-1-0', restSeconds: 75, notes: 'Drive elbows down towards hips.' },
          { id: 'e7', name: 'Incline Dumbbell Curl', targetMuscle: 'Biceps Long Head', sets: 3, reps: '10-12', rpe: 9, tempo: '3-0-1-0', restSeconds: 60, notes: 'Keep elbows behind torso for maximum stretch.' },
        ],
      },
      {
        id: 'ppl_d3',
        dayNumber: 3,
        title: 'Legs A: Quad Density & Knee Stability',
        focus: 'Quadriceps, Adductors, Calves',
        exercises: [
          { id: 'e8', name: 'Barbell Box Squat', targetMuscle: 'Quadriceps & Glutes', sets: 4, reps: '6-8', rpe: 8, tempo: '3-1-1-0', restSeconds: 150, notes: 'Pause on box without rocking.' },
          { id: 'e9', name: 'Romanian Deadlift (Dumbbells)', targetMuscle: 'Hamstrings & Glutes', sets: 3, reps: '8-10', rpe: 8, tempo: '3-1-1-0', restSeconds: 90, notes: 'Hips back, neutral lumbar spine.' },
          { id: 'e10', name: 'Seated Leg Extension', targetMuscle: 'Rectus Femoris', sets: 3, reps: '12-15', rpe: 9, tempo: '2-0-1-1', restSeconds: 60, notes: 'Pause at top contraction.' },
        ],
      },
    ],
  },
  {
    id: 'split_ul',
    code: 'U/L',
    title: 'Upper / Lower Powerbuilding',
    subtitle: '4-Day Strength & Functional Hypertrophy Split',
    durationWeeks: 6,
    daysPerWeek: 4,
    level: 'INTERMEDIATE',
    goal: 'Strength',
    color: '#00B4D8',
    bg: 'rgba(0, 180, 216, 0.15)',
    description: 'Ideal 4-day split for busy professionals maximizing recovery, progressive overload on Big 4 compound lifts, and lean muscle mass retention.',
    days: [
      {
        id: 'ul_d1',
        dayNumber: 1,
        title: 'Upper Power: Heavy Press & Pull',
        focus: 'Chest, Lats, Overhead Strength',
        exercises: [
          { id: 'ul1', name: 'Barbell Flat Bench Press', targetMuscle: 'Pectorals', sets: 4, reps: '5-5-5-5', rpe: 8.5, tempo: '2-1-1-0', restSeconds: 150, notes: 'Arch established, leg drive active.' },
          { id: 'ul2', name: 'Pendlay Barbell Row', targetMuscle: 'Mid Back', sets: 4, reps: '6-8', rpe: 8, tempo: '1-0-1-0', restSeconds: 120, notes: 'Reset on floor every single rep.' },
          { id: 'ul3', name: 'Standing Overhead Barbell Press', targetMuscle: 'Anterior Delts', sets: 3, reps: '6-8', rpe: 8.5, tempo: '2-1-1-0', restSeconds: 90, notes: 'Core braced, glutes squeezed.' },
        ],
      },
      {
        id: 'ul_d2',
        dayNumber: 2,
        title: 'Lower Power: Posterior Chain & Core',
        focus: 'Quads, Posterior Chain, Glute Max',
        exercises: [
          { id: 'ul4', name: 'Conventional Deadlift', targetMuscle: 'Posterior Chain', sets: 3, reps: '5', rpe: 8, tempo: '2-0-1-0', restSeconds: 180, notes: 'Slack pulled, lats locked.' },
          { id: 'ul5', name: 'Bulgarian Split Squat', targetMuscle: 'Quadriceps', sets: 3, reps: '8/leg', rpe: 8.5, tempo: '3-0-1-0', restSeconds: 90, notes: 'Torso slightly pitched forward.' },
        ],
      },
    ],
  },
  {
    id: 'split_531',
    code: '5/3/1',
    title: 'Wendler 5/3/1 Periodized Strength',
    subtitle: '4-Week Wave Loading for Elite Compound Peak',
    durationWeeks: 4,
    daysPerWeek: 4,
    level: 'ELITE',
    goal: 'Strength',
    color: '#FF5722',
    bg: 'rgba(255, 87, 34, 0.15)',
    description: 'Systematic percentage-based wave progression on Squat, Bench, Deadlift, and OHP with programmed deloads and AMRAP top sets.',
    days: [
      {
        id: 'w_d1',
        dayNumber: 1,
        title: 'Wave 1: Squat + Core Armor',
        focus: 'Squat 5/3/1 + Assistance Sets',
        exercises: [
          { id: 'w1', name: 'Low Bar Back Squat (Wave Top Set)', targetMuscle: 'Quads & Glutes', sets: 3, reps: '5, 5, 5+ AMRAP', rpe: 9, tempo: '2-1-1-0', restSeconds: 180, notes: 'Hit clean depth, explosive ascent.' },
          { id: 'w2', name: 'Belt Squat March', targetMuscle: 'Quads (Zero Spinal Load)', sets: 3, reps: '45s', rpe: 8, tempo: 'Continuous', restSeconds: 90, notes: 'Tension maintained.' },
        ],
      },
    ],
  },
  {
    id: 'split_rehab',
    code: 'REHAB',
    title: 'Spine & Joint Shield (McGill Protocol)',
    subtitle: '3-Day Corrective Lumbar & Orthopedic Deload',
    durationWeeks: 4,
    daysPerWeek: 3,
    level: 'BEGINNER',
    goal: 'Spine Rehab',
    color: '#89FE00',
    bg: 'rgba(137, 254, 0, 0.15)',
    description: 'Orthopedic stabilization prescription for athletes with L4-L5 disc bulges, patellar pain, or shoulder impingement.',
    days: [
      {
        id: 'r_d1',
        dayNumber: 1,
        title: 'Core Stiffness & Hip Hinge Mechanics',
        focus: 'Lumbar Neutrality & McGill Big 3',
        exercises: [
          { id: 'r1', name: 'McGill Modified Curl-Up', targetMuscle: 'Anterior Core (Zero Disc Shear)', sets: 3, reps: '6-4-2 Pyramid (10s hold)', rpe: 7, tempo: 'Isometric', restSeconds: 60, notes: 'Lumbar supported by hands, head lifts 1 inch only.' },
          { id: 'r2', name: 'Side Plank from Knees/Feet', targetMuscle: 'Quadratus Lumborum', sets: 3, reps: '10s holds × 4', rpe: 7, tempo: 'Isometric', restSeconds: 45, notes: 'Straight line shoulder to feet.' },
          { id: 'r3', name: 'Bird-Dog (Cross-Body Reach)', targetMuscle: 'Multifidus & Posterior Sling', sets: 3, reps: '6 reps/side (8s hold)', rpe: 7, tempo: 'Isometric', restSeconds: 60, notes: 'Zero pelvic rotation, clenched fists.' },
          { id: 'r4', name: 'Belt Squat or Goblet Box Squat', targetMuscle: 'Quads & Glutes (Axial-Free)', sets: 3, reps: '10-12', rpe: 7.5, tempo: '3-1-1-0', restSeconds: 90, notes: 'Sit back to 14" box, upright torso.' },
        ],
      },
    ],
  },
  {
    id: 'split_hiit',
    code: 'HIIT',
    title: 'MetCon Conditioning & Fat Loss',
    subtitle: '3-Day Metabolic Density & Lactate Threshold',
    durationWeeks: 4,
    daysPerWeek: 3,
    level: 'INTERMEDIATE',
    goal: 'Fat Loss',
    color: '#FCC419',
    bg: 'rgba(252, 196, 25, 0.15)',
    description: 'High-density circuit incorporating kettlebell complexes, assault bike sprints, and functional core intervals.',
    days: [
      {
        id: 'h_d1',
        dayNumber: 1,
        title: 'Lactate Furnace Circuit',
        focus: 'Full Body Conditioning',
        exercises: [
          { id: 'h1', name: 'Kettlebell Swings (Hardstyle)', targetMuscle: 'Posterior Chain & Power', sets: 4, reps: '20', rpe: 8.5, tempo: 'Explosive', restSeconds: 45, notes: 'Snap hips, keep lats engaged.' },
          { id: 'h2', name: 'Assault Bike Sprint', targetMuscle: 'Cardiovascular Output', sets: 5, reps: '20s on / 40s off', rpe: 9, tempo: 'Max Effort', restSeconds: 40, notes: 'Maintain > 65 RPM.' },
        ],
      },
    ],
  },
];

export const SEED_ASSIGNED_PROGRAMS: AssignedProgram[] = [
  {
    id: 'asg_1',
    clientId: 'usr_client_1',
    clientName: 'Khaled Nayeem',
    splitId: 'split_ppl',
    splitTitle: 'Push / Pull / Legs Hypertrophy',
    splitCode: 'PPL',
    assignedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    notes: 'Prescribed Box Squat variation to preserve lumbar disc spine.',
  },
  {
    id: 'asg_2',
    clientId: 'usr_client_3',
    clientName: 'Sifat Karim',
    splitId: 'split_rehab',
    splitTitle: 'Spine & Joint Shield (McGill Protocol)',
    splitCode: 'REHAB',
    assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    notes: 'Strict spine rehab protocol. No axial spinal loading under barbell.',
  },
];

export const SEED_CUSTOM_PACKAGES: CustomCoachingPackage[] = [
  {
    id: 'pkg_trial_1',
    title: '1-Day Trial Single Assessment',
    tag: 'TRIAL',
    sessionsCount: 1,
    durationDays: 7,
    priceBdt: 1500,
    frequencyPerWeek: 'Single Assessment',
    features: [
      '1-on-1 Movement & Biomechanics Screening',
      'Body Composition & Baseline BMI Breakdown',
      'Personalized Form Critique & Lift Analysis',
      'Goal & Mesocycle Consultation',
    ],
    color: '#00B4D8',
    isActive: true,
  },
  {
    id: 'pkg_monthly_12',
    title: '12-Session Monthly Hypertrophy Block',
    tag: 'POPULAR',
    sessionsCount: 12,
    durationDays: 45,
    priceBdt: 15000,
    frequencyPerWeek: '3 Days / Week',
    features: [
      '3 Dedicated 1-on-1 PT Sessions / Week',
      'Custom Periodized Workout Split Prescription',
      'Macro & Micronutrient Meal Blueprint',
      'Weekly Weigh-ins & Volume Tonnage Tracking',
      'Direct WhatsApp Coach Priority Chat',
    ],
    color: '#89FE00',
    isPopular: true,
    isActive: true,
  },
  {
    id: 'pkg_trans_24',
    title: '24-Session Elite Transformation',
    tag: 'BEST VALUE',
    sessionsCount: 24,
    durationDays: 60,
    priceBdt: 26000,
    frequencyPerWeek: '6 Days / Week Intensive',
    features: [
      '6 Intensive 1-on-1 PT Sessions / Week',
      'Advanced Strength Mesocycle & Peak Block',
      'Daily Calorie & Macro Pacing Adjustments',
      'Clinical Injury Shield & Prehab Routine',
      'Video Form Breakdown & 1RM Testing',
    ],
    color: '#FFB800',
    isActive: true,
  },
  {
    id: 'pkg_rehab_8',
    title: '8-Session Spine & Joint Shield',
    tag: 'CLINICAL REHAB',
    sessionsCount: 8,
    durationDays: 30,
    priceBdt: 10000,
    frequencyPerWeek: '2 Days / Week',
    features: [
      'NSCA Orthopedic & Spinal Assessment',
      'McGill Big 3 Spinal Stabilization Drills',
      'Axial-Unloaded Exercise Programming',
      'Joint Mobility & Soft Tissue Prehab',
    ],
    color: '#FF5722',
    isActive: true,
  },
];

export const SEED_COACH_DIET_PLANS: CoachDietPlan[] = [
  {
    id: 'diet_hypertrophy_180p',
    code: 'HYPERTROPHY_LEAN_BULK',
    title: 'Desi 180g Protein Hypertrophy Lean Bulk (2,800 kcal)',
    banglaTitle: 'দেশি ১৮০ গ্রাম প্রোটিন হাইপারট্রফি লিন বাল্ক ডায়েট',
    tag: 'Hypertrophy',
    targetCalories: 2800,
    proteinG: 180,
    carbsG: 330,
    fatG: 75,
    carbCyclingType: 'BALANCED',
    waterIntakeLiters: 4.0,
    color: '#89FE00',
    bg: 'rgba(137, 254, 0, 0.15)',
    description: 'High-protein caloric surplus with local whole foods (eggs, chicken, rui fish, curd, oats). Perfect for building lean muscle without excess fat gain.',
    coachGuidelines: [
      'Drink 1L water immediately upon waking to kickstart metabolic clearance.',
      'Take 5g Creatine Monohydrate with post-workout fast carbs (apple or coconut water).',
      'Ensure 8 hours of deep sleep to maximize muscle protein synthesis.',
      'Distribute protein evenly across 4-5 meals (30-45g protein per feeding window).',
    ],
    meals: [
      {
        id: 'm1_bf',
        mealType: 'BREAKFAST',
        title: 'Power Eggs & Rolled Oats',
        banglaTitle: '৪টি ডিম ও ওটস নাস্তা',
        foods: ['4 Whole Boiled Eggs (Farm/Desi)', '100g Rolled Oats with 1 Banana & 1 tsp Honey', '250ml Warm Water with Lemon'],
        calories: 650,
        proteinG: 38,
        carbsG: 80,
        fatG: 18,
        timing: '08:00 AM (Within 1h of waking)',
        notes: 'Boil eggs soft/hard. Do not discard egg yolks—healthy fats support testosterone.',
      },
      {
        id: 'm1_lu',
        mealType: 'LUNCH',
        title: 'Desi Chicken & Brown Rice Bowl',
        banglaTitle: 'গ্রিলড চিকেন ও লাল চালের ভাত',
        foods: ['200g Grilled / Light Curry Chicken Breast', '200g Boiled Lal (Brown) Rice', '1 Bowl Thick Masoor Dal', 'Fresh Cucumber & Tomato Salad with Lemon'],
        calories: 750,
        proteinG: 56,
        carbsG: 92,
        fatG: 14,
        timing: '01:30 PM (Midday)',
        notes: 'Use mustard oil or cold-pressed olive oil in minimal quantity (max 1 tsp).',
      },
      {
        id: 'm1_pre',
        mealType: 'PRE_WORKOUT',
        title: 'Pre-Workout Chola & Roti',
        banglaTitle: 'ছোলা-বুট ও লাল আটার রুটি',
        foods: ['2 Hand-Made Lal Atta Roti', '100g Boiled Chola / Chickpeas with Ginger & Black Salt', '1 Cup Black Coffee (No Sugar)'],
        calories: 380,
        proteinG: 18,
        carbsG: 60,
        fatG: 6,
        timing: '04:30 PM (60-75 mins before lifting)',
        notes: 'Caffeine enhances CNS motor unit recruitment and focus during heavy squats/bench.',
      },
      {
        id: 'm1_post',
        mealType: 'POST_WORKOUT',
        title: 'Anabolic Whey & Fruit Recovery',
        banglaTitle: 'হোয়ে প্রোটিন ও ফ্রুট শেক',
        foods: ['1 Scoop Whey Protein Isolate (30g)', '1 Fresh Apple or 250ml Fresh Daab (Coconut Water)', '5g Creatine Monohydrate mixed in water'],
        calories: 220,
        proteinG: 28,
        carbsG: 24,
        fatG: 1,
        timing: '07:00 PM (Within 45 mins post-workout)',
        notes: 'Rapid glycogen replenishment and muscle tissue repair.',
      },
      {
        id: 'm1_din',
        mealType: 'DINNER',
        title: 'Fresh River Rui Fish & Green Veggies',
        banglaTitle: 'তাজা রুই মাছের ঝোল ও ভাত',
        foods: ['180g Rui / Katla / Bhetki Fish Fillet', '150g Boiled Lal Rice', '1 Cup Sautéed Spinach (Palong Shak) & Lau/Gourd'],
        calories: 580,
        proteinG: 36,
        carbsG: 60,
        fatG: 16,
        timing: '09:30 PM (2 hours before sleep)',
        notes: 'River fish provides rich EPA/DHA omega-3 fatty acids for joint lubrication.',
      },
      {
        id: 'm1_bed',
        mealType: 'BEDTIME_SNACK',
        title: 'Casein Tok Doi & Almonds',
        banglaTitle: 'টক দই ও কাঠবাদাম',
        foods: ['150g Fresh Tok Doi (Probiotic Curd)', '10 Raw Almonds (Kathbadam)'],
        calories: 220,
        proteinG: 14,
        carbsG: 14,
        fatG: 12,
        timing: '11:00 PM (Right before bed)',
        notes: 'Slow-digesting dairy casein sustains amino acid levels throughout 8h sleep.',
      },
    ],
    supplements: [
      {
        id: 'sup_1',
        name: 'Creatine Monohydrate 200 Mesh',
        dosage: '5g Daily',
        timing: 'Post-workout with fruit/fast carb drink',
        purpose: 'Increases phosphocreatine stores for explosive strength & muscular fullness.',
        isMandatory: true,
        brandSuggestion: 'Optimum Nutrition / MuscleTech Platinum',
      },
      {
        id: 'sup_2',
        name: 'Whey Protein Isolate 90%',
        dosage: '1 Scoop (30g powder = 27g Protein)',
        timing: 'Immediately post-workout',
        purpose: 'Rapid leucine spike to trigger mTOR muscle protein synthesis.',
        isMandatory: true,
        brandSuggestion: 'Dymatize ISO 100 / ON Gold Standard',
      },
      {
        id: 'sup_3',
        name: 'Omega-3 Fish Oil (Triple Strength)',
        dosage: '1 Softgel (1000mg EPA/DHA)',
        timing: 'With lunch or dinner',
        purpose: 'Reduces exercise-induced delayed onset muscle soreness (DOMS) & joint inflammation.',
        isMandatory: false,
        brandSuggestion: 'Sports Research / Carlson Labs',
      },
      {
        id: 'sup_4',
        name: 'Vitamin D3 + K2',
        dosage: '2000 IU Daily',
        timing: 'Morning with breakfast',
        purpose: 'Hormonal optimization and bone mineral density support.',
        isMandatory: false,
        brandSuggestion: 'Now Foods / Doctor\'s Best',
      },
    ],
  },
  {
    id: 'diet_fat_loss_shred',
    code: 'DESI_FAT_LOSS_CUT',
    title: 'Desi Aggressive Fat Loss & Shredding (1,900 kcal)',
    banglaTitle: 'দেশি ফ্যাট লস ও শ্র্যাডিং ডিফিসিট ডায়েট',
    tag: 'Fat Loss',
    targetCalories: 1900,
    proteinG: 165,
    carbsG: 160,
    fatG: 45,
    carbCyclingType: 'BALANCED',
    waterIntakeLiters: 3.8,
    color: '#FF922B',
    bg: 'rgba(255, 146, 43, 0.15)',
    description: 'High-protein satiety deficit plan. High volume spinach/leafy greens and low glycemic carbs to preserve muscle while stripping stubborn body fat.',
    coachGuidelines: [
      'Drink 500ml water before every meal to increase fullness and gastric stretch.',
      'Maintain strict 165g protein floor to prevent muscle catabolism during caloric deficit.',
      'Zero refined sugar, sugary juices, sweet curd, or deep-fried singara/samusa.',
      'Add 10,000 daily steps for steady non-exercise activity thermogenesis (NEAT).',
    ],
    meals: [
      {
        id: 'm2_bf',
        mealType: 'BREAKFAST',
        title: 'Egg White Omelet & Whole Grain',
        banglaTitle: '৫টি ডিমের সাদা অংশ ও লাল আটার রুটি',
        foods: ['5 Egg Whites + 1 Whole Egg Omelet (Zero Oil Spray / 2 drops mustard oil)', '1 Whole Wheat Roti', '1 Cup Green Tea (Sugar Free)'],
        calories: 310,
        proteinG: 32,
        carbsG: 20,
        fatG: 8,
        timing: '08:00 AM',
        notes: 'High protein to kickstart morning thermogenesis.',
      },
      {
        id: 'm2_lu',
        mealType: 'LUNCH',
        title: 'Grilled Chicken & Massive Green Salad',
        banglaTitle: 'গ্রিলড চিকেন ও পালং শাক বাটি',
        foods: ['180g Grilled Skinless Chicken Breast', '120g Boiled Lal Rice (Measured Cooked)', 'Big Bowl Steamed Spinach (Palong Shak) & Cucumber'],
        calories: 520,
        proteinG: 48,
        carbsG: 45,
        fatG: 10,
        timing: '01:30 PM',
        notes: 'Greens provide high dietary fiber and zero net insulin spike.',
      },
      {
        id: 'm2_pre',
        mealType: 'PRE_WORKOUT',
        title: 'Green Apple & Almonds Snack',
        banglaTitle: 'সবুজ আপেল ও কাঠবাদাম',
        foods: ['1 Medium Green Apple', '5 Raw Almonds', '1 Cup Black Coffee (Pre-workout boost)'],
        calories: 140,
        proteinG: 3,
        carbsG: 22,
        fatG: 4,
        timing: '04:30 PM',
        notes: 'Caffeine mobilizes free fatty acids for fuel.',
      },
      {
        id: 'm2_post',
        mealType: 'POST_WORKOUT',
        title: 'Pure Isolate Shake',
        banglaTitle: 'হোয়ে আইসোলেট শেক',
        foods: ['1.2 Scoops Whey Isolate with 300ml Cold Water'],
        calories: 150,
        proteinG: 32,
        carbsG: 2,
        fatG: 1,
        timing: '07:00 PM',
        notes: 'Pure protein without excess carbohydrates or fats.',
      },
      {
        id: 'm2_din',
        mealType: 'DINNER',
        title: 'Baked Fish Fillet & Broccoli',
        banglaTitle: 'বেকড মাছ ও ব্রকলি/ফুলকপি',
        foods: ['160g Baked Pangash / Tilapia / Rui Fish Fillet', 'Steamed Cauliflower & Broccoli with Black Pepper', '1/2 Bowl Thin Lentil Soup (Dal)'],
        calories: 480,
        proteinG: 38,
        carbsG: 40,
        fatG: 12,
        timing: '09:00 PM',
        notes: 'Light evening meal allows comfortable digestion and deep sleep.',
      },
      {
        id: 'm2_bed',
        mealType: 'BEDTIME_SNACK',
        title: 'Cinnamon Low-Fat Curd',
        banglaTitle: 'দারুচিনি টক দই',
        foods: ['100g Low-Fat Tok Doi with 1 pinch Ceylon Cinnamon Powder'],
        calories: 100,
        proteinG: 10,
        carbsG: 10,
        fatG: 2,
        timing: '10:30 PM',
        notes: 'Cinnamon improves overnight glucose regulation.',
      },
    ],
    supplements: [
      {
        id: 'sup_fat_1',
        name: 'Whey Protein Isolate 90%',
        dosage: '1.2 Scoops (36g powder)',
        timing: 'Post-workout',
        purpose: 'Preserves lean muscle mass in caloric deficit.',
        isMandatory: true,
        brandSuggestion: 'Dymatize ISO 100',
      },
      {
        id: 'sup_fat_2',
        name: 'L-Carnitine L-Tartrate',
        dosage: '1500mg Daily',
        timing: '20 mins before morning cardio / workout',
        purpose: 'Facilitates mitochondrial fatty acid oxidation.',
        isMandatory: false,
        brandSuggestion: 'GAT Sport / MuscleTech',
      },
      {
        id: 'sup_fat_3',
        name: 'Multivitamin & Zinc Elite',
        dosage: '1 Tablet Daily',
        timing: 'With lunch',
        purpose: 'Prevents micronutrient deficiencies during restricted calorie dieting.',
        isMandatory: true,
        brandSuggestion: 'Opti-Men / MusclePharm',
      },
    ],
  },
  {
    id: 'diet_recomp_carb_cycle',
    code: 'RECON_CARB_CYCLE',
    title: 'Body Recomp Carb Cycling Matrix (2,300 kcal)',
    banglaTitle: 'বডি রিকম্পোজিশন কার্ব সাইক্লিং প্ল্যান',
    tag: 'Carb Cycling',
    targetCalories: 2300,
    proteinG: 175,
    carbsG: 230,
    fatG: 60,
    carbCyclingType: 'TRAINING_VS_REST',
    trainingDayCarbsG: 300,
    restDayCarbsG: 140,
    waterIntakeLiters: 4.0,
    color: '#00B4D8',
    bg: 'rgba(0, 180, 216, 0.15)',
    description: 'Carb cycling for simultaneous fat loss and muscle gain. High carbohydrates on heavy lifting days (Squat/Deadlift/Bench) to drive performance, lower carbohydrates & healthy fats on rest days.',
    coachGuidelines: [
      'On Heavy Training Days: Eat 300g Carbs (add extra rice, oats, sweet potatoes).',
      'On Rest / Recovery Days: Cut rice portion by 50% (140g Carbs) and increase tok doi and healthy fats.',
      'Maintain 175g Protein constant on both training and rest days.',
    ],
    meals: [
      {
        id: 'm3_bf',
        mealType: 'BREAKFAST',
        title: '3 Whole Eggs & Oats Bowl',
        banglaTitle: '৩টি ডিম ও ওটস বাটি',
        foods: ['3 Whole Eggs (Boiled/Poached)', '60g Oats with Fresh Blueberries / Pomegranate', '250ml Water'],
        calories: 460,
        proteinG: 28,
        carbsG: 45,
        fatG: 14,
        timing: '08:00 AM',
        notes: 'Pomegranate polyphenols support nitric oxide and blood flow.',
      },
      {
        id: 'm3_lu',
        mealType: 'LUNCH',
        title: 'Chicken Curry & Steamed Lal Rice',
        banglaTitle: 'মুরগির মাংস ও লাল চালের ভাত',
        foods: ['180g Chicken Breast Curry (Light Mustard Oil)', '180g Boiled Lal Rice', 'Mixed Vegetable Sabji (Papaya, Carrot, Potol)'],
        calories: 640,
        proteinG: 46,
        carbsG: 68,
        fatG: 16,
        timing: '01:30 PM',
        notes: 'High complex carbs to fuel evening compound training.',
      },
      {
        id: 'm3_pre',
        mealType: 'PRE_WORKOUT',
        title: 'Chola & Banana Energy Pack',
        banglaTitle: 'ছোলা-বুট ও কলা',
        foods: ['1 Hand-Made Lal Atta Roti', '80g Boiled Chola', '1 Medium Sagor Banana'],
        calories: 340,
        proteinG: 14,
        carbsG: 58,
        fatG: 4,
        timing: '04:30 PM',
        notes: 'Banana provides potassium for muscular contraction.',
      },
      {
        id: 'm3_post',
        mealType: 'POST_WORKOUT',
        title: 'Isolate & Daab Hydration',
        banglaTitle: 'হোয়ে আইসোলেট ও ডাবের পানি',
        foods: ['1 Scoop Whey Protein Isolate', '250ml Fresh Daab Water (Electrolytes)', '5g Creatine Monohydrate'],
        calories: 230,
        proteinG: 26,
        carbsG: 24,
        fatG: 1,
        timing: '07:00 PM',
        notes: 'Natural coconut water electrolytes prevent post-lifting cramping.',
      },
      {
        id: 'm3_din',
        mealType: 'DINNER',
        title: 'Katla Fish & Veggie Sauté',
        banglaTitle: 'কাতলা মাছ ও সবজি',
        foods: ['160g Katla Fish Fillet Curry', '100g Lal Rice', '1 Bowl Thick Dal with Spinach'],
        calories: 510,
        proteinG: 38,
        carbsG: 45,
        fatG: 15,
        timing: '09:30 PM',
        notes: 'Lean fish protein with anti-inflammatory turmeric.',
      },
      {
        id: 'm3_bed',
        mealType: 'BEDTIME_SNACK',
        title: 'Walnut & Probiotic Curd',
        banglaTitle: 'আখরোট ও টক দই',
        foods: ['120g Fresh Tok Doi', '5 Raw Walnuts (Akrot)'],
        calories: 160,
        proteinG: 11,
        carbsG: 8,
        fatG: 10,
        timing: '11:00 PM',
        notes: 'Walnuts provide ALA omega-3 for cognitive and central nervous recovery.',
      },
    ],
    supplements: [
      {
        id: 'sup_rc_1',
        name: 'Creatine Monohydrate',
        dosage: '5g Daily',
        timing: 'Post-workout',
        purpose: 'Increases strength & lean muscle hydration.',
        isMandatory: true,
      },
      {
        id: 'sup_rc_2',
        name: 'Whey Protein Isolate',
        dosage: '1 Scoop (30g)',
        timing: 'Post-workout',
        purpose: 'Fast-absorbing protein.',
        isMandatory: true,
      },
      {
        id: 'sup_rc_3',
        name: 'ZMA (Zinc, Magnesium & B6)',
        dosage: '1 Capsule',
        timing: '30 mins before sleep',
        purpose: 'Enhances REM sleep and neuromuscular restoration.',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'diet_eggetarian_desi',
    code: 'HIGH_PROTEIN_VEG_DESI',
    title: 'Eggetarian / Vegetarian Desi High-Protein (2,200 kcal)',
    banglaTitle: 'এগিট্যারিয়ান দেশি হাই-প্রোটিন প্ল্যান',
    tag: 'Eggetarian',
    targetCalories: 2200,
    proteinG: 145,
    carbsG: 240,
    fatG: 65,
    carbCyclingType: 'BALANCED',
    waterIntakeLiters: 3.5,
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.15)',
    description: 'Plant, egg, and dairy powered plan utilizing Paneer, Chola, Soya chunks (badi), lentils, curd, and farm eggs for maximum protein bioavailability without meat.',
    coachGuidelines: [
      'Boil and rinse soya chunks thoroughly with hot water to remove excess phyto-flavors.',
      'Use high-quality whole farm eggs for complete branched-chain amino acids (BCAA).',
      'Take Vitamin B12 regularly to maintain neurological energy.',
    ],
    meals: [
      {
        id: 'm4_bf',
        mealType: 'BREAKFAST',
        title: '3 Boiled Eggs & Peanut Butter Oats',
        banglaTitle: '৩টি ডিম ও পিনাট বাটার ওটস',
        foods: ['3 Whole Boiled Eggs', '80g Rolled Oats', '1 tbsp Natural Peanut Butter (No Sugar)'],
        calories: 520,
        proteinG: 30,
        carbsG: 50,
        fatG: 18,
        timing: '08:00 AM',
        notes: 'Healthy fats from peanut butter provide sustained morning energy.',
      },
      {
        id: 'm4_lu',
        mealType: 'LUNCH',
        title: 'Soya Chunks Bhuna & Dal Rice',
        banglaTitle: 'সয়া চাঙ্ক ভুনা ও ডাল-ভাত',
        foods: ['100g Soya Chunks (Soya Bodi) Curry', '150g Boiled Lal Rice', '1 Bowl Thick Masoor Dal', 'Tomato & Cucumber Salad'],
        calories: 620,
        proteinG: 48,
        carbsG: 75,
        fatG: 12,
        timing: '01:30 PM',
        notes: 'Soya chunks contain over 52g protein per 100g dry weight.',
      },
      {
        id: 'm4_snk',
        mealType: 'PRE_WORKOUT',
        title: 'Boiled Chola & Green Chillies',
        banglaTitle: 'ছোলা-বুট ও কাঁচামরিচ সালাদ',
        foods: ['120g Boiled Chola / Chickpeas', 'Chopped Onions, Green Chillies & Mustard Oil (1 drop)'],
        calories: 250,
        proteinG: 14,
        carbsG: 38,
        fatG: 4,
        timing: '04:30 PM',
        notes: 'High complex low-GI carbs provide smooth energy for lifting.',
      },
      {
        id: 'm4_post',
        mealType: 'POST_WORKOUT',
        title: 'Whey / Plant Shake & Banana',
        banglaTitle: 'প্রোটিন শেক ও কলা',
        foods: ['1 Scoop Whey or Plant Isolate Protein', '1 Medium Banana', '5g Creatine Monohydrate'],
        calories: 230,
        proteinG: 26,
        carbsG: 27,
        fatG: 2,
        timing: '07:00 PM',
        notes: 'High bioavailability protein replenishment.',
      },
      {
        id: 'm4_din',
        mealType: 'DINNER',
        title: 'Paneer Curry & Whole Wheat Roti',
        banglaTitle: 'পনির তরকারি ও লাল আটার রুটি',
        foods: ['120g Fresh Low-Fat Paneer Curry', '2 Whole Wheat Roti', 'Sautéed Palong Shak (Spinach)'],
        calories: 480,
        proteinG: 28,
        carbsG: 45,
        fatG: 18,
        timing: '09:30 PM',
        notes: 'Paneer provides casein dairy protein and calcium.',
      },
      {
        id: 'm4_bed',
        mealType: 'BEDTIME_SNACK',
        title: 'Fresh Tok Doi',
        banglaTitle: 'তাজা টক দই',
        foods: ['100g Fresh Homemade Tok Doi'],
        calories: 100,
        proteinG: 9,
        carbsG: 8,
        fatG: 3,
        timing: '11:00 PM',
        notes: 'Maintains healthy gut microbiome and continuous amino delivery.',
      },
    ],
    supplements: [
      {
        id: 'sup_veg_1',
        name: 'Whey or Plant Protein Isolate',
        dosage: '1 Scoop (30g)',
        timing: 'Post-workout',
        purpose: 'Ensures optimal daily protein intake without excessive carbs.',
        isMandatory: true,
      },
      {
        id: 'sup_veg_2',
        name: 'Vitamin B12 (Methylcobalamin)',
        dosage: '1000mcg (3 times weekly)',
        timing: 'Morning with water',
        purpose: 'Essential for vegetarian nerve function & red blood cell formation.',
        isMandatory: true,
      },
      {
        id: 'sup_veg_3',
        name: 'Creatine Monohydrate',
        dosage: '5g Daily',
        timing: 'Post-workout',
        purpose: 'Significantly boosts strength in vegetarians who have lower baseline muscle creatine.',
        isMandatory: true,
      },
    ],
  },
  {
    id: 'diet_rehab_anti_inflammatory',
    code: 'SPINE_JOINT_ANTI_INFLAMMATORY',
    title: 'Spine, Joint & Anti-Inflammatory Recovery (2,000 kcal)',
    banglaTitle: 'জয়েন্ট রিকভারি ও অ্যান্টি-ইনফ্ল্যামেটরি ডায়েট',
    tag: 'Rehab',
    targetCalories: 2000,
    proteinG: 150,
    carbsG: 200,
    fatG: 60,
    carbCyclingType: 'BALANCED',
    waterIntakeLiters: 3.8,
    color: '#FCC419',
    bg: 'rgba(252, 196, 25, 0.15)',
    description: 'Rich in natural collagen, small river fish, turmeric curcumin, antioxidants, and bone broth to soothe spine disc inflammation and accelerate joint repair.',
    coachGuidelines: [
      'Drink 1 cup warm bone broth (Paya/Chicken bone soup) daily for rich Type II collagen.',
      'Incorporate haldi (turmeric) with black pepper to boost curcumin absorption by 2000%.',
      'Avoid high-sugar snacks and seed oils that trigger systemic joint inflammation.',
    ],
    meals: [
      {
        id: 'm5_bf',
        mealType: 'BREAKFAST',
        title: '3 Poached Eggs & Golden Turmeric Milk',
        banglaTitle: '৩টি ডিম ও হলুদ-দুধ',
        foods: ['3 Whole Poached Eggs', '1 Slice Whole Grain Bread', '1 Cup Warm Milk with Pure Haldi (Turmeric) & Pinch Black Pepper'],
        calories: 420,
        proteinG: 26,
        carbsG: 30,
        fatG: 16,
        timing: '08:00 AM',
        notes: 'Curcumin soothes inflammatory pathways (NF-kB inhibition).',
      },
      {
        id: 'm5_lu',
        mealType: 'LUNCH',
        title: 'Mola/Kachki Small Fish & Lal Rice',
        banglaTitle: 'ছোট মাছ (মলা/কাচকি) ও লাল চালের ভাত',
        foods: ['180g Small River Fish Curry (Mola / Dhela / Kachki)', '150g Boiled Lal Rice', 'Mixed Green Vegetables (Lau, Jhinga, Palong Shak)'],
        calories: 580,
        proteinG: 42,
        carbsG: 60,
        fatG: 18,
        timing: '01:30 PM',
        notes: 'Whole small fish eaten with bones provide bioavailable calcium and phosphorus.',
      },
      {
        id: 'm5_snk',
        mealType: 'PRE_WORKOUT',
        title: 'Fresh Bone Broth & Raw Almonds',
        banglaTitle: 'হাড়ের স্যুপ (বোন ব্রথ) ও কাঠবাদাম',
        foods: ['1 Cup Warm Bone Broth Soup (Chicken / Mutton Paya)', '10 Raw Almonds'],
        calories: 180,
        proteinG: 14,
        carbsG: 4,
        fatG: 10,
        timing: '04:30 PM',
        notes: 'Natural gelatin and glycine for tendon collagen synthesis.',
      },
      {
        id: 'm5_post',
        mealType: 'POST_WORKOUT',
        title: 'Collagen Whey & Pineapple',
        banglaTitle: 'কোলাজেন প্রোটিন ও আনারস',
        foods: ['1 Scoop Whey or Collagen Peptides (20g)', '1 Cup Fresh Pineapple (Contains natural Bromelain for joint swelling)'],
        calories: 220,
        proteinG: 26,
        carbsG: 25,
        fatG: 1,
        timing: '07:00 PM',
        notes: 'Bromelain enzymes naturally reduce soft tissue swelling.',
      },
      {
        id: 'm5_din',
        mealType: 'DINNER',
        title: 'Grilled Chicken & Sweet Potato Mash',
        banglaTitle: 'গ্রিলড চিকেন ও মিষ্টি আলু',
        foods: ['150g Grilled Chicken Breast', '150g Boiled Sweet Potato (Misti Alu)', 'Sautéed Garlic Spinach (Palong Shak)'],
        calories: 500,
        proteinG: 40,
        carbsG: 50,
        fatG: 12,
        timing: '09:30 PM',
        notes: 'Sweet potatoes provide beta-carotene antioxidants for cellular repair.',
      },
      {
        id: 'm5_bed',
        mealType: 'BEDTIME_SNACK',
        title: 'Tok Doi Probiotic Shield',
        banglaTitle: 'টক দই',
        foods: ['100g Fresh Homemade Tok Doi'],
        calories: 100,
        proteinG: 8,
        carbsG: 8,
        fatG: 3,
        timing: '11:00 PM',
        notes: 'Probiotics reduce gut endotoxins that trigger systemic joint ache.',
      },
    ],
    supplements: [
      {
        id: 'sup_rh_1',
        name: 'Hydrolyzed Collagen Peptides Type 1 & 2',
        dosage: '10g Daily',
        timing: 'With morning drink or post-rehab',
        purpose: 'Directly stimulates chondrocytes and disc proteoglycan synthesis.',
        isMandatory: true,
        brandSuggestion: 'Vital Proteins / Sports Research',
      },
      {
        id: 'sup_rh_2',
        name: 'Triple Strength Omega-3 EPA/DHA',
        dosage: '1500mg EPA/DHA Daily',
        timing: 'With lunch',
        purpose: 'Potent anti-inflammatory action for lumbar spine discs & joints.',
        isMandatory: true,
      },
      {
        id: 'sup_rh_3',
        name: 'Glucosamine Sulfate + Chondroitin + MSM',
        dosage: '1500mg Glucosamine / 1000mg MSM',
        timing: 'With breakfast',
        purpose: 'Cartilage matrix maintenance and synovial fluid lubrication.',
        isMandatory: false,
      },
      {
        id: 'sup_rh_4',
        name: 'Curcumin 95% + Piperine Extract',
        dosage: '500mg Daily',
        timing: 'With dinner',
        purpose: 'Suppresses inflammatory prostaglandins and joint stiffness.',
        isMandatory: false,
      },
    ],
  },
];

export const SEED_ASSIGNED_DIET_PLANS: AssignedDietPlan[] = [
  {
    id: 'asg_diet_1',
    clientId: 'usr_client_1',
    clientName: 'Khaled Nayeem',
    dietPlanId: 'diet_hypertrophy_180p',
    dietTitle: 'Desi 180g Protein Hypertrophy Lean Bulk (2,800 kcal)',
    calories: 2800,
    proteinG: 180,
    carbsG: 330,
    fatG: 75,
    assignedAt: '2026-08-01T08:00:00Z',
    status: 'ACTIVE',
    customNotes: 'Prescribed by Coach Alex. Focus on 4L water and post-workout Daab water hydration.',
    supplementsList: SEED_COACH_DIET_PLANS[0].supplements,
    waterIntakeLiters: 4.0,
  },
  {
    id: 'asg_diet_2',
    clientId: 'usr_client_2',
    clientName: 'Tanvir Ahmed',
    dietPlanId: 'diet_hypertrophy_180p',
    dietTitle: 'Desi 180g Protein Hypertrophy Lean Bulk (2,800 kcal)',
    calories: 2800,
    proteinG: 180,
    carbsG: 330,
    fatG: 75,
    assignedAt: '2026-08-05T09:30:00Z',
    status: 'ACTIVE',
    customNotes: 'Clean lean bulk for Chest & Delts mesocycle.',
    supplementsList: SEED_COACH_DIET_PLANS[0].supplements,
    waterIntakeLiters: 4.0,
  },
  {
    id: 'asg_diet_3',
    clientId: 'usr_client_3',
    clientName: 'Sifat Karim',
    dietPlanId: 'diet_rehab_anti_inflammatory',
    dietTitle: 'Spine, Joint & Anti-Inflammatory Recovery (2,000 kcal)',
    calories: 2000,
    proteinG: 150,
    carbsG: 200,
    fatG: 60,
    assignedAt: '2026-08-10T11:00:00Z',
    status: 'ACTIVE',
    customNotes: 'L4-L5 spine disc recovery protocol. Daily bone broth and haldi milk mandated.',
    supplementsList: SEED_COACH_DIET_PLANS[4].supplements,
    waterIntakeLiters: 3.8,
  },
];

type TrainerState = {
  profile: TrainerProfile;
  clients: AthleteClientDossier[];
  appointments: TrainerAppointmentSlot[];
  programs: ProgramSplit[];
  assignedPrograms: AssignedProgram[];
  customPackages: CustomCoachingPackage[];
  coachDietPlans: CoachDietPlan[];
  assignedDietPlans: AssignedDietPlan[];
  sessionNotes: string;
  selectedDate: string;
  isLoaded: boolean;

  // Actions
  loadTrainerData: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  punchAttendance: (slotId: string) => Promise<void>;
  updateAppointmentStatus: (slotId: string, status: AppointmentStatus) => Promise<void>;
  addAppointment: (slot: Omit<TrainerAppointmentSlot, 'id'>) => Promise<void>;
  deleteAppointment: (slotId: string) => Promise<void>;
  updateProfile: (updated: Partial<TrainerProfile>) => Promise<void>;
  addCertification: (cert: Omit<TrainerCertification, 'id'>) => Promise<void>;
  addTransformation: (trans: Omit<ClientTransformation, 'id'>) => Promise<void>;

  // Custom Coaching Package Actions
  addCustomPackage: (pkgData: Omit<CustomCoachingPackage, 'id'>) => Promise<string>;
  updateCustomPackage: (id: string, partial: Partial<CustomCoachingPackage>) => Promise<void>;
  deleteCustomPackage: (id: string) => Promise<void>;
  togglePackageActive: (id: string) => Promise<void>;

  // Client CRM Actions
  addClient: (clientData: Omit<AthleteClientDossier, 'id'>) => Promise<string>;
  updateClient: (id: string, updates: Partial<AthleteClientDossier>) => Promise<void>;
  punchClientSession: (clientId: string, topic?: string) => Promise<{ remaining: number; shouldAlertRenewal: boolean }>;
  renewClientPackage: (
    clientId: string,
    packageType: string,
    options?: {
      paymentMethod?: PaymentMethod;
      transactionId?: string;
      amountBdt?: number;
      note?: string;
      customSessions?: number;
      customPrice?: number;
    }
  ) => Promise<void>;
  logPayment: (
    clientId: string,
    payment: Omit<PtPaymentRecord, 'id' | 'date'> & { date?: string }
  ) => Promise<void>;
  addProgressPhoto: (
    clientId: string,
    photo: Omit<ClientProgressPhoto, 'id' | 'date'> & { date?: string }
  ) => Promise<void>;
  removeProgressPhoto: (clientId: string, photoId: string) => Promise<void>;
  addClientInjury: (clientId: string, injury: Omit<ClientInjuryRecord, 'id'>) => Promise<void>;

  // Program Designer Actions
  assignProgramToClient: (clientId: string, splitId: string, notes?: string) => Promise<void>;
  setSessionNotes: (notes: string) => Promise<void>;

  // Coach Diet & Macro Prescription Actions
  addCoachDietPlan: (plan: Omit<CoachDietPlan, 'id'>) => Promise<string>;
  updateCoachDietPlan: (id: string, updates: Partial<CoachDietPlan>) => Promise<void>;
  deleteCoachDietPlan: (id: string) => Promise<void>;
  assignDietPlanToClient: (clientId: string, planId: string, customNotes?: string) => Promise<void>;
};

export const useTrainerStore = create<TrainerState>((set, get) => ({
  profile: SEED_PROFILE,
  clients: SEED_CLIENTS,
  appointments: SEED_APPOINTMENTS,
  programs: SEED_PROGRAMS,
  assignedPrograms: SEED_ASSIGNED_PROGRAMS,
  customPackages: SEED_CUSTOM_PACKAGES,
  coachDietPlans: SEED_COACH_DIET_PLANS,
  assignedDietPlans: SEED_ASSIGNED_DIET_PLANS,
  sessionNotes: 'Khaled: Box Squat 100kg form solid. Sifat: McGill Big 3 endurance improving.',
  selectedDate: getTodayString(),
  isLoaded: false,

  loadTrainerData: async () => {
    try {
      const stored = await getStorageItem(TRAINER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          profile: parsed.profile || SEED_PROFILE,
          clients: parsed.clients || SEED_CLIENTS,
          appointments: parsed.appointments || SEED_APPOINTMENTS,
          programs: parsed.programs || SEED_PROGRAMS,
          assignedPrograms: parsed.assignedPrograms || SEED_ASSIGNED_PROGRAMS,
          customPackages: parsed.customPackages || SEED_CUSTOM_PACKAGES,
          coachDietPlans: parsed.coachDietPlans || SEED_COACH_DIET_PLANS,
          assignedDietPlans: parsed.assignedDietPlans || SEED_ASSIGNED_DIET_PLANS,
          sessionNotes: parsed.sessionNotes || 'Khaled: Box Squat 100kg form solid. Sifat: McGill Big 3 endurance improving.',
          isLoaded: true,
        });
        return;
      }
    } catch {
      // fallback
    }
    set({ isLoaded: true });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  punchAttendance: async (slotId) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedSlots = get().appointments.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            status: 'COMPLETED' as AppointmentStatus,
            attendancePunchedAt: timeNow,
          }
        : slot
    );

    // Also auto-increment client completed sessions if matched
    const targetSlot = get().appointments.find((s) => s.id === slotId);
    let updatedClients = get().clients;
    if (targetSlot) {
      updatedClients = get().clients.map((c) => {
        if (c.id === targetSlot.clientId || c.name === targetSlot.clientName) {
          const completed = Math.min(c.package.completedSessions + 1, c.package.totalSessions);
          const remaining = Math.max(0, c.package.totalSessions - completed);
          const newAtt = {
            id: `att_${Date.now()}`,
            date: getTodayString(),
            timeSlot: targetSlot.timeSlot,
            topic: targetSlot.targetFocus,
          };
          return {
            ...c,
            package: {
              ...c.package,
              completedSessions: completed,
              remainingSessions: remaining,
              attendanceHistory: [newAtt, ...c.package.attendanceHistory],
            },
          };
        }
        return c;
      });
    }

    set({ appointments: updatedSlots, clients: updatedClients });
    await saveState(get());
  },

  updateAppointmentStatus: async (slotId, status) => {
    const updated = get().appointments.map((slot) =>
      slot.id === slotId ? { ...slot, status } : slot
    );
    set({ appointments: updated });
    await saveState(get());
  },

  addAppointment: async (slotData) => {
    const newSlot: TrainerAppointmentSlot = {
      ...slotData,
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    const updated = [newSlot, ...get().appointments];
    set({ appointments: updated });
    await saveState(get());
  },

  deleteAppointment: async (slotId) => {
    const updated = get().appointments.filter((slot) => slot.id !== slotId);
    set({ appointments: updated });
    await saveState(get());
  },

  updateProfile: async (partial) => {
    const updated = { ...get().profile, ...partial };
    set({ profile: updated });
    await saveState(get());
  },

  addCertification: async (certData) => {
    const newCert: TrainerCertification = {
      ...certData,
      id: `cert_${Date.now()}`,
    };
    const updatedProfile = {
      ...get().profile,
      certifications: [newCert, ...get().profile.certifications],
    };
    set({ profile: updatedProfile });
    await saveState(get());
  },

  addTransformation: async (transData) => {
    const newTrans: ClientTransformation = {
      ...transData,
      id: `trans_${Date.now()}`,
    };
    const updatedProfile = {
      ...get().profile,
      transformations: [newTrans, ...get().profile.transformations],
    };
    set({ profile: updatedProfile });
    await saveState(get());
  },

  // CUSTOM COACHING PACKAGE ACTIONS
  addCustomPackage: async (pkgData) => {
    const newPkg: CustomCoachingPackage = {
      ...pkgData,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [newPkg, ...get().customPackages];
    set({ customPackages: updated });
    await saveState(get());
    return newPkg.id;
  },

  updateCustomPackage: async (id, partial) => {
    const updated = get().customPackages.map((p) => (p.id === id ? { ...p, ...partial } : p));
    set({ customPackages: updated });
    await saveState(get());
  },

  deleteCustomPackage: async (id) => {
    const updated = get().customPackages.filter((p) => p.id !== id);
    set({ customPackages: updated });
    await saveState(get());
  },

  togglePackageActive: async (id) => {
    const updated = get().customPackages.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    set({ customPackages: updated });
    await saveState(get());
  },

  // CLIENT CRM ACTIONS
  addClient: async (clientData) => {
    const newId = `usr_client_${Date.now()}`;
    const newClient: AthleteClientDossier = {
      ...clientData,
      id: newId,
    };
    const updated = [newClient, ...get().clients];
    const updatedProfile = {
      ...get().profile,
      activeClientsCount: updated.filter((c) => c.status === 'ACTIVE').length,
    };
    set({ clients: updated, profile: updatedProfile });
    await saveState(get());

    // If starter split provided, automatically create program assignment
    if (clientData.starterSplitId && clientData.starterSplitId !== 'NONE') {
      await get().assignProgramToClient(newId, clientData.starterSplitId);
    }

    return newId;
  },

  updateClient: async (id, updates) => {
    const updated = get().clients.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ clients: updated });
    await saveState(get());
  },

  punchClientSession: async (clientId, topic) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let result = { remaining: 0, shouldAlertRenewal: false };
    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        const completed = Math.min(c.package.completedSessions + 1, c.package.totalSessions);
        const remaining = Math.max(0, c.package.totalSessions - completed);
        const shouldAlertRenewal = remaining <= 1;
        result = { remaining, shouldAlertRenewal };
        const newAtt = {
          id: `att_${Date.now()}`,
          date: getTodayString(),
          timeSlot: timeNow,
          topic: topic || 'Personal Coaching & Form Progression',
        };
        return {
          ...c,
          package: {
            ...c.package,
            completedSessions: completed,
            remainingSessions: remaining,
            attendanceHistory: [newAtt, ...(c.package.attendanceHistory || [])],
          },
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
    return result;
  },

  renewClientPackage: async (clientId, packageType, options) => {
    let totalSessions = 12;
    let priceBdt = 15000;

    if (packageType === 'TRANSFORMATION_24') {
      totalSessions = 24;
      priceBdt = 26000;
    } else if (packageType === 'TRIAL_1') {
      totalSessions = 1;
      priceBdt = 1500;
    } else if (options?.customSessions) {
      totalSessions = options.customSessions;
      priceBdt = options.customPrice ?? 15000;
    }

    if (options?.amountBdt) {
      priceBdt = options.amountBdt;
    }

    const expiryDays = totalSessions >= 24 ? 60 : 45;
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = getTodayString();

    const paymentEntry: PtPaymentRecord = {
      id: `pay_${Date.now()}`,
      date: today,
      amountBdt: priceBdt,
      method: options?.paymentMethod || 'bKash',
      transactionId: options?.transactionId || undefined,
      note: options?.note || `Package Renewal (${totalSessions} Sessions)`,
    };

    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          package: {
            ...c.package,
            packageType,
            totalSessions,
            completedSessions: 0,
            remainingSessions: totalSessions,
            startDate: today,
            expiryDate,
            priceBdt,
            isPaid: true,
            paymentLog: [paymentEntry, ...(c.package.paymentLog || [])],
          },
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
  },

  logPayment: async (clientId, paymentData) => {
    const newRecord: PtPaymentRecord = {
      id: `pay_${Date.now()}`,
      date: paymentData.date || getTodayString(),
      amountBdt: paymentData.amountBdt,
      method: paymentData.method,
      transactionId: paymentData.transactionId,
      note: paymentData.note,
    };
    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          package: {
            ...c.package,
            paymentLog: [newRecord, ...(c.package.paymentLog || [])],
          },
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
  },

  addProgressPhoto: async (clientId, photoData) => {
    const newPhoto: ClientProgressPhoto = {
      id: `photo_${Date.now()}`,
      date: photoData.date || getTodayString(),
      label: photoData.label || 'Progress Check-in',
      uri: photoData.uri,
      weightAtTime: photoData.weightAtTime,
      bodyFatAtTime: photoData.bodyFatAtTime,
      notes: photoData.notes,
    };
    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          progressPhotos: [newPhoto, ...(c.progressPhotos || [])],
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
  },

  removeProgressPhoto: async (clientId, photoId) => {
    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          progressPhotos: (c.progressPhotos || []).filter((p) => p.id !== photoId),
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
  },

  addClientInjury: async (clientId, injuryData) => {
    const newInjury: ClientInjuryRecord = {
      ...injuryData,
      id: `inj_${Date.now()}`,
    };
    const updated = get().clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          injuries: [newInjury, ...c.injuries],
        };
      }
      return c;
    });
    set({ clients: updated });
    await saveState(get());
  },

  assignProgramToClient: async (clientId, splitId, notes) => {
    const targetClient = get().clients.find((c) => c.id === clientId);
    const targetSplit = get().programs.find((p) => p.id === splitId);
    if (!targetClient || !targetSplit) return;

    const newAssignment: AssignedProgram = {
      id: `asg_${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.name,
      splitId: targetSplit.id,
      splitTitle: targetSplit.title,
      splitCode: targetSplit.code,
      assignedAt: new Date().toISOString(),
      status: 'ACTIVE',
      notes: notes || `Assigned ${targetSplit.code} (${targetSplit.durationWeeks}-week block) by Coach Alex.`,
    };

    // Replace any active assignment for this client or prepend
    const filtered = get().assignedPrograms.filter((a) => a.clientId !== clientId);
    const updated = [newAssignment, ...filtered];
    set({ assignedPrograms: updated });
    await saveState(get());
  },

  setSessionNotes: async (notes: string) => {
    set({ sessionNotes: notes });
    await saveState(get());
  },

  // COACH DIET & MACRO PRESCRIPTION ACTIONS
  addCoachDietPlan: async (planData) => {
    const newPlan: CoachDietPlan = {
      ...planData,
      id: `diet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [newPlan, ...get().coachDietPlans];
    set({ coachDietPlans: updated });
    await saveState(get());
    return newPlan.id;
  },

  updateCoachDietPlan: async (id, updates) => {
    const updated = get().coachDietPlans.map((d) => (d.id === id ? { ...d, ...updates } : d));
    set({ coachDietPlans: updated });
    await saveState(get());
  },

  deleteCoachDietPlan: async (id) => {
    const updated = get().coachDietPlans.filter((d) => d.id !== id);
    set({ coachDietPlans: updated });
    await saveState(get());
  },

  assignDietPlanToClient: async (clientId, planId, customNotes) => {
    const targetClient = get().clients.find((c) => c.id === clientId);
    const targetPlan = get().coachDietPlans.find((p) => p.id === planId);
    if (!targetClient || !targetPlan) return;

    const newAssignment: AssignedDietPlan = {
      id: `asg_diet_${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.name,
      dietPlanId: targetPlan.id,
      dietTitle: targetPlan.title,
      calories: targetPlan.targetCalories,
      proteinG: targetPlan.proteinG,
      carbsG: targetPlan.carbsG,
      fatG: targetPlan.fatG,
      assignedAt: new Date().toISOString(),
      status: 'ACTIVE',
      customNotes: customNotes || `Prescribed by Coach Alex. Target: ${targetPlan.targetCalories} kcal with ${targetPlan.proteinG}g Protein.`,
      supplementsList: targetPlan.supplements,
      waterIntakeLiters: targetPlan.waterIntakeLiters,
    };

    // Update client dossier with assigned diet plan
    const updatedClients = get().clients.map((c) =>
      c.id === clientId ? { ...c, dietPlan: newAssignment } : c
    );

    // Update assigned diet plans list
    const filteredAssigned = get().assignedDietPlans.filter((a) => a.clientId !== clientId);
    const updatedAssigned = [newAssignment, ...filteredAssigned];

    set({ clients: updatedClients, assignedDietPlans: updatedAssigned });
    await saveState(get());
  },
}));

async function saveState(state: TrainerState) {
  try {
    const payload = JSON.stringify({
      profile: state.profile,
      clients: state.clients,
      appointments: state.appointments,
      programs: state.programs,
      assignedPrograms: state.assignedPrograms,
      customPackages: state.customPackages,
      coachDietPlans: state.coachDietPlans,
      assignedDietPlans: state.assignedDietPlans,
      sessionNotes: state.sessionNotes,
    });
    await setStorageItem(TRAINER_STORAGE_KEY, payload);
  } catch (e) {
    console.error('Failed to save trainer state:', e);
  }
}

