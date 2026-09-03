# 📋 Vital Fitness & Health OS — Comprehensive Architecture & Module Audit

> **Document Version:** 2.0.0  
> **Last Updated:** August 2026  
> **Application:** Vital Health, Fitness & Clinical OS (`fitnes-my-app`)  
> **Stack:** React Native (Expo SDK 54, Expo Router v4), TypeScript, Zustand, TanStack Query, TailwindCSS (NativeWind), Reanimated, Lucide/MaterialIcons.

---

## 🎯 Executive Overview & Purpose

**Vital** is an all-in-one **Personal Health, Fitness, Nutrition, and Clinical Care Operating System**. Built with an **offline-first**, privacy-centric architecture, it bridges daily wellness (macros, workouts, fasting, habits) with comprehensive clinical healthcare management (prescriptions, diagnostic biomarker tracking, chronic disease shields, and emergency health profiles).

This audit document catalogs every integrated module, its clinical/functional purpose, why it was implemented, and the specific value it provides to users and healthcare caregivers.

---

## 🧭 Navigation & Core Tab Architecture

The app uses a 5-tab floating curved tab bar ([floating-tab-bar.tsx](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/navigation/floating-tab-bar.tsx)):

| Tab Index | Tab Screen | Route | Focus Area |
| :---: | :--- | :--- | :--- |
| **1** | 🏠 **Home (Today)** | `/(app)/(tabs)/index` | Daily glance dashboard, health quick actions, greeting, habits, to-dos & active fast widget. |
| **2** | 🥗 **Nutrition** | `/(app)/(tabs)/nutrition` | Calorie/macro burn gauges, food log, hydration tracker, AI meal planner, Bengali GI guide & medication. |
| **3** | ➕ **Add (Speed Dial)** | `/(app)/(tabs)/add` | 1-Tap speed dial for logging doctor visits, medicines, lab reports, meals, workouts & focus sessions. |
| **4** | ⏱️ **Fasting** | `/(app)/(tabs)/fasting` | Circadian intermittent fasting tracker, live metabolic countdowns, protocols (16:8, OMAD) & Ramadan Guard. |
| **5** | 🏋️ **Training** | `/(app)/(tabs)/training` | GPS running, workout sessions, cardio telemetry, sets/reps logging & performance PRs. |

---

## 📦 Detailed Module Catalog & Facility Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             VITAL APPLICATION SUITE                              │
├───────────────────┬───────────────────┬──────────────────┬───────────────────────┤
│ 1. Clinical OS    │ 2. Nutrition & GI │ 3. Fasting Engine│ 4. Training & Fitness │
│ • Health Vault    │ • Macro Tracker   │ • Intermittent   │ • GPS Running Tracker │
│ • Chronic Care    │ • AI Meal Planner │ • Ramadan Guard  │ • Workout Logger      │
│ • Disease Shields │ • Desi Food GI    │ • Metabolic Sync │ • Telemetry History   │
│ • Emergency Card  │ • Hydration Log   │ • Protocol Chips │ • Heart Rate Zones    │
├───────────────────┴───────────────────┴──────────────────┴───────────────────────┤
│ 5. Habits & Productivity: Deep Focus Pomodoro, Circadian Routines, Priority Tasks│
│ 6. Core Infrastructure: Multi-Role Auth (User & Trainer), Bilingual (EN/BN), Units│
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. 🏥 Family Health Vault & Clinical Care OS
* **Primary Stores:** `stores/health-vault-store.ts`, `stores/chronic-care-store.ts`
* **Components Directory:** `components/health-vault/`

#### Facilities & Sub-Modules:
1. **Prescription & Chamber Consultation Log ([AddMedicalEventModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/add-medical-event-modal.tsx))**:
   * **Why it was added:** Patients in South Asia frequently lose physical paper prescriptions and doctor recommendations between follow-ups.
   * **How it helps:** Stores doctor names, hospital clinics, clinical diagnoses, vitals at time of visit (BP, Pulse, Weight, Blood Sugar), prescribed medications, and auto-syncs pills to the digital Medicine Cabinet.
2. **Biomarker & Diagnostic Test Manager ([LabResultManagerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/lab-result-manager-modal.tsx))**:
   * **Why it was added:** Diagnostic reports (HbA1c, CBC, Creatinine, Lipid profile, SGPT) are scattered across different diagnostic centers.
   * **How it helps:** Standardizes biomarker values against clinical reference ranges (Normal, Warning, Critical) with longitudinal trend lines.
3. **AI Prescription OCR & Bengali Explainer ([AIHealthScannerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/ai-health-scanner-modal.tsx), [AIReportExplainerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/ai-report-explainer-modal.tsx))**:
   * **Why it was added:** Medical jargon in English is often incomprehensible to non-medical users and family elders.
   * **How it helps:** Uses AI OCR to parse paper prescriptions and generates simplified explanations in plain Bengali with dietary and safety tips.
4. **Diagnostic Lab Cost Comparator ([LabCostComparatorModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/lab-cost-comparator-modal.tsx))**:
   * **Why it was added:** Diagnostic test pricing varies wildly between diagnostic chains (Popular, Ibn Sina, Square, Labaid, Praava).
   * **How it helps:** Provides instant cost comparison, home sample collection availability, and discount estimations across Dhaka labs.
5. **National Emergency & Digital Health Card ([EmergencyHotlineModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/emergency-hotline-modal.tsx), [EmergencyHealthCardModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/emergency-health-card-modal.tsx))**:
   * **Why it was added:** In acute emergencies, first responders need immediate access to blood group, chronic conditions, and emergency contacts.
   * **How it helps:** Generates an offline-accessible Emergency Health Card with QR code containing critical medical info, allergies, and emergency hotlines (999, National Ambulance, Blood Banks).
6. **Generic Medicine Alternative Finder ([GenericMedicineFinderModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/generic-medicine-finder-modal.tsx))**:
   * **Why it was added:** Brand-name medicines often go out of stock or carry high markups.
   * **How it helps:** Matches any brand medicine (Square, Beximco, Incepta, Renata) to its exact generic salt molecule and presents lower-cost DGDA-approved alternatives.
7. **Multi-Member Family Profiles & Genetic Hereditary Tree ([FamilyMemberManagerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/family-member-manager-modal.tsx), [FamilyHereditaryTreeModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/family-hereditary-tree-modal.tsx))**:
   * **Why it was added:** Chronic diseases (Diabetes, Hypertension, CAD) have high genetic familial transmission.
   * **How it helps:** Manages separate health vaults for Self (Khaled), Parents, and Children, and calculates hereditary risk scores for 3 generations.
8. **Insurance Claim Dossier Exporter ([InsuranceClaimExportModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/insurance-claim-export-modal.tsx))**:
   * **Why it was added:** Health insurance claim submission requires organized chronological bundles of prescriptions, invoices, and lab reports.
   * **How it helps:** Compiles structured PDF/ZIP claim documentation packages with 1 click.

---

### 2. 🛡️ Specialized Clinical Condition Shields

| Shield Module | Primary Component | Clinical Purpose & Key Facilities |
| :--- | :--- | :--- |
| **🦟 Dengue Fluid & Platelet Monitor** | [DengueFluidMonitorModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/dengue-fluid-monitor-modal.tsx) | Tracks NS1/IgM status, daily platelet drop, Hematocrit (HCT) hemoconcentration, and WHO weight-based hourly fluid intake schedule. |
| **💨 Air Quality & Asthma Shield** | [AqiAsthmaShieldModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/aqi-asthma-shield-modal.tsx) | Live PM2.5/AQI monitoring for Dhaka/Chattogram with respiratory risk index, inhaler dosage logging, and peak flow rate tracking. |
| **🤰 Pregnancy & Postpartum Care** | [PregnancyCareModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/pregnancy-care-modal.tsx) | Trimester milestones, gestational diabetes glucose logs, fetal kick counter, Antenatal Care (ANC) visit tracker, and postpartum mood/recovery. |
| **❤️ Hypertension & Heart Shield** | [HypertensionHeartShieldModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/hypertension-heart-shield-modal.tsx) | AHA BP categorization (Normal, Elevated, Stage 1/2, Crisis), MAP (Mean Arterial Pressure), sodium intake limits, and morning surge alerts. |
| **👴 Elderly & Fall Prevention** | [ElderlyCareModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/elderly-care-modal.tsx) | Geriatric health metrics, mobility scores, medication compliance audits, and caregiver alert triggers. |
| **🩸 Anemia & Hemoglobin Shield** | [AnemiaHemoglobinShieldModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/anemia-hemoglobin-shield-modal.tsx) | Tracks Hemoglobin (Hb) levels, iron supplement schedules, and recommends local iron-rich foods (Kolar Mocha, Danta Shak, Kolija). |
| **💧 Urine Color Hydration Shield** | [UrineHydrationShieldModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/urine-hydration-shield-modal.tsx) | 8-level visual urine color chart to detect clinical dehydration, heat exhaustion, and renal strain. |
| **🧪 Uric Acid & Gout Shield** | [UricAcidGoutModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/uric-acid-gout-modal.tsx) | Serum uric acid monitoring, gout flare-up logging, and purine dietary classification (avoid red meat, lentils, organ meats). |
| **🧠 Memory & Cognitive Tracker** | [MemoryDementiaModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/memory-dementia-modal.tsx) | Mini-Mental State Examination (MMSE) tests, orientation checks, and early dementia screening tools. |
| **🦴 Osteoporosis & Joint Shield** | [OsteoporosisJointModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/osteoporosis-joint-modal.tsx) | Bone mineral density (DEXA T-score), calcium/Vit-D3 adherence, and low-impact knee osteoarthritis exercises. |
| **👁️ Diabetic Eye & Retinopathy** | [DiabeticVisionModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/diabetic-vision-modal.tsx) | Annual dilated fundus exam reminders, vision blurriness logs, and diabetic retinopathy progression screening. |
| **👂 Hearing & Essential Tremor** | [HearingTremorModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/hearing-tremor-modal.tsx) | Frequency audiometry test simulations and smartphone gyroscope-based hand tremor frequency/amplitude measurement. |
| **💊 Polypharmacy & Drug Interaction**| [PolypharmacyShieldModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/health-vault/polypharmacy-shield-modal.tsx)| Scans prescription combinations for severe drug-drug interactions, duplicate therapies, and renal clearance warnings. |

---

### 3. 🥗 Nutrition, Hydration & Desi Food GI Engine
* **Primary Stores:** `stores/nutrition-ui-store.ts`, `stores/medicine-store.ts`
* **Components Directory:** `components/nutrition/`

#### Key Facilities:
1. **Dynamic Macro & Calorie Burn Engine ([RemainingHero](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/remaining-hero.tsx))**:
   * Calculates live remaining calorie envelope, Protein, Carbohydrates, and Fat bars with auto-adjustment from workout expenditure.
2. **AI Meal Planner ([AIMealPlannerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/ai-meal-planner-modal.tsx))**:
   * Customizes meal suggestions based on target calorie deficits/surpluses using locally accessible ingredients and recipes.
3. **Desi Food Sugar & GI Guide ([BanglaFoodGiModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/bangla-food-gi-modal.tsx), [bangla-food-gi-catalog.ts](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/services/bangla-food-gi-catalog.ts))**:
   * Catalogs 100+ local Bangladeshi foods with Glycemic Index (GI), Glycemic Load (GL), and diabetes ratings.
   * **Plate Sugar Spike Simulator:** Simulates combination plates (e.g., Red Rice + Bitter Gourd + Lentils) to calculate post-meal glucose spike risk.
4. **Smart Hydration & Quick Undo ([HydrationCard](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/hydration-card.tsx), [WaterUndoToast](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/water-undo-toast.tsx))**:
   * Quick water intake logging with container presets (250ml cup, 500ml bottle, 1L flask) and a 6-second multi-level undo buffer.
5. **Medicine Cabinet & Expiry Radar ([MedicineCabinetModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/medicine-cabinet-modal.tsx), [MedicineExpiryRadarModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/nutrition/medicine-expiry-radar-modal.tsx))**:
   * Morning, afternoon, and evening dose scheduling, automated pill inventory decrementing, and low-stock/expiry push alerts.

---

### 4. ⏱️ Intermittent Fasting & Ramadan Guard
* **Primary Hooks & Services:** `hooks/fasting-queries.ts`, `services/fasting-api.ts`
* **Components Directory:** `components/fasting/`

#### Key Facilities:
1. **Circadian Fasting Hero & Live Biological Stages ([FastingHero](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/fasting/fasting-hero.tsx))**:
   * Real-time timer highlighting active cellular stages:
     * **0–4h:** Blood Sugar Stabilization
     * **4–8h:** Glycogen Depletion & Insulin Drop
     * **8–12h:** Ketosis & Fat Oxidation
     * **12–16h:** Cellular Autophagy Activation
     * **16–24h:** Peak Human Growth Hormone (HGH)
2. **Configurable Fasting Protocols**:
   * 16:8 (Leangains), 18:6 (Fat Loss), 20:4 (Warrior), 24h (OMAD), 36h (Monk Fast), 5:2 Weekly.
3. **Ramadan Guard ([RamadanGuardModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/fasting/ramadan-guard-modal.tsx))**:
   * Automated Sehri and Iftar countdown timers, non-fasting hydration timeline, electrolyte advice, and diabetes blood sugar check reminders during fasting hours.

---

### 5. 🏋️ Training, Workouts & GPS Running
* **Primary Services:** `services/running-api.ts`, `use-cases/workout.use-cases.ts`
* **Components Directory:** `components/training/`

#### Key Facilities:
1. **GPS Run Tracker & Cardio Telemetry**:
   * Live pace calculation (min/km), distance tracking, elevation gain, split intervals, and calorie burn integration.
2. **Strength & Workout Logging Engine**:
   * Exercise database, sets, reps, weight (kg/lbs), rest interval timers, and automated 1RM (One Rep Max) calculation.

---

### 6. 🧠 Habits, Daily Routines & Productivity
* **Primary Stores:** `stores/routine-store.ts`, `stores/todo-store.ts`
* **Components Directories:** `components/focus/`, `components/todo/`, `components/routine/`

#### Key Facilities:
1. **Deep Focus Pomodoro ([today-focus.tsx](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/app/(app)/today-focus.tsx))**:
   * 25/50 min focus intervals, ambient soundscapes, focus streak tracking, and daily productivity heatmaps.
2. **Circadian Daily Routines ([RoutineTimelineModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/routine/routine-timeline-modal.tsx))**:
   * Morning sunlight protocol, hydration habit, post-dinner walk, and screen-off sleep hygiene tracker.
3. **Smart Priority Tasks ([TodoManagerModal](file:///c:/Users/Khaled/Khaled%20Dask/app/fitnes-my-app/components/todo/todo-manager-modal.tsx))**:
   * Eisenhower matrix categorization (High/Medium/Low priority), medical task checklists, and deadline alarms.

---

### 7. 🔐 Multi-Role Authentication & Demo Access
* **Primary Files:** `types/auth.ts`, `contexts/auth-context.tsx`, `app/(auth)/login.tsx`

#### Key Facilities:
1. **1-Tap Role Selector**:
   * 👤 **Regular Athlete/User (`khaled@demo.com`)**: Tailored for individual members tracking nutrition, workouts, and vitals.
   * 🏋️‍♂️ **Certified Gym Trainer (`trainer@gym.com`)**: Tailored for coaches managing athlete training programs and nutrition plans.
2. **Offline-First Token Storage**:
   * Secure local caching with `expo-secure-store` and standalone offline demo fallbacks.

---

## 📊 Summary Architecture Matrix

| Module Name | Core Store / Context | User Facing Screen / Modal | Target Beneficiary |
| :--- | :--- | :--- | :--- |
| **Family Health Vault** | `health-vault-store.ts` | Health Vault Studio & Modals | Families, Elderly, Chronic Care Patients |
| **Clinical Shields (Dengue, Asthma, etc.)** | `health-vault-store.ts` | 14 Specialized Clinical Modals | Patients with specific acute/chronic conditions |
| **Nutrition & Macros** | `nutrition-ui-store.ts` | Nutrition Tab (`nutrition.tsx`) | Athletes, Diabetics, Fitness Enthusiasts |
| **Desi Food GI Engine** | `bangla-food-gi-catalog.ts`| Bangla Food GI Modal | Pre-diabetic & Diabetic Bangladeshi users |
| **Intermittent Fasting** | `fasting-queries.ts` | Fasting Tab (`fasting.tsx`) | Weight-loss & metabolic health seekers |
| **Ramadan Guard** | `fasting-queries.ts` | Ramadan Guard Modal | Fasting Muslims during Ramadan / Nawafil |
| **Training & Running** | `running-api.ts` | Training Tab (`training.tsx`) | Runners, Gym lifters, Cardio enthusiasts |
| **Medicine Cabinet** | `medicine-store.ts` | Medicine Cabinet Modal | Daily medication & supplement consumers |
| **Deep Focus Timer** | `today-focus.tsx` | Today Focus Screen | Students, Programmers, Professionals |
| **Circadian Routines** | `routine-store.ts` | Routine Timeline Modal | Habit builders, biohackers |
| **Multi-Role Auth** | `auth-context.tsx` | Login Screen (`login.tsx`) | Regular athletes & Gym trainers |

---

*This document serves as the official reference for feature auditing, codebase inspection, and system verification.*
