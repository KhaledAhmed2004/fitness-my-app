# 🥗 GymOS: Diet & Workout Routine Prescriber Specification
> **Document Code:** `GYM-SPEC-012-DIET-AND-WORKOUT-PRESCRIBER`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Desi Nutrition Library, Multi-Split Workout Presets, 1-Tap Branded WhatsApp Dispatcher & Member Profile Sync  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & The Coaching Friction](#1-executive-summary--the-coaching-friction)
2. [Desi Nutritional Realism vs. Foreign Western Diets](#2-desi-nutritional-realism-vs-foreign-western-diets)
3. [Stakeholder Impact Matrix](#3-stakeholder-impact-matrix)
4. [The 4 Core Architectural Pillars](#4-the-4-core-architectural-pillars)
5. [Technical Architecture & TypeScript Contracts](#5-technical-architecture--typescript-contracts)
6. [Pre-built Desi Diet & Routine Catalog](#6-pre-built-desi-diet--routine-catalog)
7. [WhatsApp Branded Prescription Formatting](#7-whatsapp-branded-prescription-formatting)

---

## 1. Executive Summary & The Coaching Friction

In commercial fitness centers across Bangladesh (Dhaka, Chittagong, Sylhet), **over 80% of new gym members seek immediate guidance on nutrition and exercise routines**.
Historically, this has created significant operational failure:
- Floor coaches scribble illegible, fragmented notes on torn paper receipts (*"সকালে ২টা ডিম, দুপুরে ১ কাপ ভাত..."*), which members lose within 48 hours.
- Downloaded internet diets demand exorbitant ingredients (Salmon, Avocados, Quinoa, Greek Yogurt) that alienate members and fail compliance.
- General members feel abandoned by coaches who prioritize high-ticket Personal Training (PT), leading to member dropout and negative word-of-mouth.

**GymOS Diet & Routine Prescriber** arms gym owners and trainers with a standardized, science-backed library of Desi macro-budget meal plans and structured workout splits, dispatched instantly to the member's WhatsApp with full gym branding.

---

## 2. Desi Nutritional Realism vs. Foreign Western Diets

| Foreign Internet Diets (Unrealistic) | GymOS Desi Science-Backed Nutrition |
| :--- | :--- |
| Salmon fillet, Tuna steak | Local Rohu (রুই), Pangas, Tilapia or Boiled Eggs |
| Avocados & Olive oil | Mustard oil (সরিষার তেল), Peanuts (চিনাবাদাম) |
| Quinoa & Imported Berries | Brown/White Rice (ভাত), Red Lentils (মসুর ডাল), Bananas |
| Whey Isolate 3x a day | Chickpea Sattu (ছাতু), Boiled Gram (ছোলা), Milk |
| Monthly cost: ৳১৫,০০০+ | **Budget options from ৳৩,৫০০ – ৳৭,৫০০/month** |

---

## 3. Stakeholder Impact Matrix

| Persona | Traditional Friction | GymOS Transformation |
| :--- | :--- | :--- |
| **Gym Owner** | Reputation damaged by coaches neglecting general members; advice vanishes if coach quits. | Branded, uniform gym standards; member profile permanently stores assigned routines. |
| **Floor Coach** | Waste 20 minutes daily repeating the same advice on paper scraps. | 1-tap selection, optional personal advice note, instant WhatsApp send in 10 seconds. |
| **Male Beginner** | Confusion, intimidation on the gym floor, lifting random weights. | Structured 3-day or PPL routine with exact sets, reps, and warm-up guidelines. |
| **Female Member** | Fear of bulking, PCOS concerns, lack of tailored dietary advice. | Low-GI, high-fiber Desi meal plans and targeted glute/core shaping circuits. |

---

## 4. The 4 Core Architectural Pillars

1. **Pre-built Desi Macro-Budget Diet Library:**
   - Standard Corporate Fat Loss (1600 kcal)
   - Student / Budget Muscle Beast (2400 kcal)
   - Ladies Toning & Metabolic Balance (1400 kcal)
   - Lean Muscle Recomposition (2000 kcal)
2. **Multi-Split Workout Routine Presets:**
   - Beginner 3-Day Full Body Circuit
   - 4-Day Push-Pull-Legs Hypertrophy
   - 5-Day Fat Loss & HIIT Metabolic Burner
3. **1-Tap WhatsApp Prescriber with Gym Branding:**
   - High-contrast, beautifully formatted emojis, meal-by-meal timing, and coach's personal motivation note.
4. **The PT Upsell Hook:**
   - Embedded discreet callout at the end of standard plans: *"Want custom 1-on-1 macro tracking & form supervision? Upgrade to a 12-Session PT Pack with Coach {Trainer}!"*

---

## 5. Technical Architecture & TypeScript Contracts

### Data Contracts (`types/gym.ts`):

```typescript
export type DietGoalCategory = 'FAT_LOSS' | 'MUSCLE_BULK' | 'LEAN_TONING' | 'MAINTENANCE';
export type DietBudgetType = 'BUDGET_STUDENT' | 'STANDARD_DESI' | 'PREMIUM_EXECUTIVE';

export interface GymDietMealItem {
  mealTime: 'BREAKFAST' | 'MID_MORNING' | 'LUNCH' | 'PRE_WORKOUT' | 'POST_WORKOUT' | 'DINNER';
  title: string;
  itemsBengali: string[];
  approxCalories: number;
  proteinGrams: number;
  substitutions?: string;
}

export interface GymDietPlanTemplate {
  id: string;
  title: string;
  category: DietGoalCategory;
  budgetType: DietBudgetType;
  dailyCalories: number;
  dailyProteinGrams: number;
  description: string;
  meals: GymDietMealItem[];
  dosAndDonts: string[];
}

export interface GymWorkoutRoutineTemplate {
  id: string;
  title: string;
  splitType: 'FULL_BODY_3DAY' | 'PUSH_PULL_LEGS' | 'UPPER_LOWER_4DAY' | 'FAT_LOSS_CIRCUIT';
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  daysSchedule: {
    dayName: string;
    exercises: { name: string; setsReps: string; notes?: string }[];
  }[];
  coachingTips: string[];
}

export interface MemberAssignedPlanRecord {
  id: string;
  assignedDate: string; // YYYY-MM-DD
  assignedByTrainerId: string;
  assignedByTrainerName: string;
  dietPlanTitle?: string;
  workoutRoutineTitle?: string;
  coachPersonalNotes?: string;
}
```

---

## 6. Pre-built Desi Diet & Routine Catalog

### Plan 1: Standard Corporate Fat Loss (1,600 kcal | 110g Protein)
* **Breakfast:** ২টা সেদ্ধ ডিম (১ কুসুমসহ), ১ কাপ ওটস বা ২টা লাল আটার রুটি, ১ কাপ ব্ল্যাক কফি / গ্রিন টি।
* **Lunch:** ১ কাপ লাল চালের ভাত, ১৫০ গ্রাম মুরগির ব্রেস্ট বা বড় ১ টুকরো রুই মাছ, প্রচুর সবুজ সালাদ ও পাতলা ডাল।
* **Snack / Pre-workout:** ১টি দেশি কলা ও ব্ল্যাক কফি।
* **Dinner:** ২টা পাতলা রুটি, ১ বাটি সবজি ভাজি, ১০০ গ্রাম গ্রিল করা মুরগি বা মাছ।

### Routine 1: Beginner 3-Day Full Body Circuit
* **Day 1:** Barbell Bench Press (3x10), Lat Pulldowns (3x12), Leg Press (3x12), Dumbbell Shoulder Press (3x10), Plank (3x45s).
* **Day 2:** Rest & 30-min brisk walk.
* **Day 3:** Incline Dumbbell Press (3x10), Seated Cable Rows (3x12), Barbell Romanian Deadlifts (3x10), Bicep Curls & Tricep Pushdowns (3x12).
* **Day 4:** Rest.
* **Day 5:** Bodyweight Squats (3x15), Dumbbell Chest Fly (3x12), Pull-ups / Assisted (3x8), Hanging Leg Raises (3x12).

---

## 7. WhatsApp Branded Prescription Formatting

```text
🥗 *OFFICIAL NUTRITION & WORKOUT PRESCRIPTION* 🏋️‍♂️
🏢 *IronForge Fitness Arena*
👤 Athlete: *Tanvir Ahmed* | Coach: *Coach Alex*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *GOAL: FAT LOSS & RECOMPOSITION (1,600 kcal)*
⚡ Protein Target: ~110g / day | Water: 3.5 Liters
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🍳 *DAILY DESI MEAL SCHEDULE:*

🌅 *সকালের নাস্তা (08:00 AM):*
• ২টি সেদ্ধ ডিম (১টি সম্পূর্ণ, ১টি কুসুম ছাড়া)
• ২টি লাল আটার পাতলা রুটি অথবা ১ কাপ ওটস
• ১ কাপ লাল চা / গ্রিন টি (চিনি ছাড়া)

☀️ *দুপুরের খাবার (01:30 PM):*
• ১ কাপ লাল চালের ভাত
• ১৫০ গ্রাম মুরগির মাংস (চামড়া ছাড়া) অথবা বড় ১ টুকরা মাছ
• ১ বাটি সবুজ সবজি ও প্রচুর শসা-টমেটো সালাদ

☕ *বিকেলের নাস্তা / প্রি-ওয়ার্কআউট (05:30 PM):*
• ১টি দেশি কলা + ১ কাপ ব্ল্যাক কফি

🌙 *রাতের খাবার (09:00 PM):*
• ১টি লাল আটার রুটি + ১ বাটি পাতলা ডাল ও সবজি
• ১০০ গ্রাম গ্রিল করা মাছ অথবা ১ গ্লাস লো-ফ্যাট দুধ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *COACH'S ADVICE:*
"সপ্তাহে অন্তত ৪ দিন জিম ফ্লোরে আসবেন। ভাজা-পোড়া ও কোমল পানীয় সম্পূর্ণ এড়িয়ে চলুন।"

💡 *Need 1-on-1 dedicated form coaching & daily macro adjustments? Ask front desk about Coach Alex's 12-Session PT Program!*

— Powered by GymOS Performance Engine 🚀
```
