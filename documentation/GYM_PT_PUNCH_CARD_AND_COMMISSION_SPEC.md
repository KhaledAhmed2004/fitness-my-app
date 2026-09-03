# 🥊 GymOS: Personal Training (PT) Punch-Card & Trainer Commission Engine Specification
> **Document Code:** `GYM-SPEC-010-PT-PUNCH-CARD-AND-COMMISSION`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Personal Training Session Punch-Cards, Visual Stamp Matrix, Real-time Trainer Commission Ledger & 1-Tap WhatsApp Session Slips  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & The Commercial Reality](#1-executive-summary--the-commercial-reality)
2. [Stakeholder Analysis Matrix](#2-stakeholder-analysis-matrix)
3. [The 5 Core PT Governance Pillars](#3-the-5-core-pt-governance-pillars)
4. [Features vs. Benefits Matrix](#4-features-vs-benefits-matrix)
5. [Technical Architecture & TypeScript Contracts](#5-technical-architecture--typescript-contracts)
6. [UI / UX Wireframes & 30-Second Punch Workflow](#6-ui--ux-wireframes--30-second-punch-workflow)
7. [Edge Cases & Intelligent Safeguards](#7-edge-cases--intelligent-safeguards)
8. [Automated WhatsApp Session Punch Receipt](#8-automated-whatsapp-session-punch-receipt)
9. [Feature Prioritization Matrix](#9-feature-prioritization-matrix)

---

## 1. Executive Summary & The Commercial Reality

In commercial gyms across Bangladesh, Personal Training (PT) accounts for **35% to 50% of total gross revenue**, yet it is run on coffee-stained paper notebooks or mental tallies. This breeds constant friction:
* **Member claims:** *"I only took 7 sessions!"*
* **Trainer claims:** *"No brother, all 12 are finished!"*
* **Owner loses:** Time, trust, and reputation mediating bitter disputes, while paying trainers manually calculated commissions at month-end.

```
                       THE REAL-WORLD PT CONFLICT LIFECYCLE
┌─────────────────────────┐
│ Member Buys 12 Sessions │ (Pays ৳15,000 to Gym Cashier)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ Trainer Marks in Diary  │ (Manual tick marks, coffee stains, lost pages)
└────────────┬────────────┘
             ▼
      [ Day 40 Dispute ]
             ├──────────────────────────────────────────────────────┐
             ▼                                                      ▼
   "Brother, I took 7!"                                   "No, you took 11!"
   (Member claims 5 remain)                               (Trainer claims 1 remain)
             │                                                      │
             └───────────────────────┬──────────────────────────────┘
                                     ▼
                     💥 OWNER BECOMES THE REFEREE
                 Member feels cheated ➔ Refuses to Renew
                 Trainer feels underpaid ➔ Resigns/Steals client
```

### 🥊 The GymOS Solution:
Digitizes every PT package into a **Visual Punch Stamp Card** (`[✅][✅][✅][✅][✅][⭕][⭕][⭕][⭕][⭕][⭕][⭕]`), dispatches **1-Tap WhatsApp Session Slips** after each workout to prevent ghost-punching, and automatically syncs earned trainer commissions (`30% - 50%`) straight into the staff payroll ledger.

---

## 2. Stakeholder Analysis Matrix

| Stakeholder | Pain Points | Needs & Expectations | Risks & Vulnerabilities | Desired Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **🏋️ Gym Owner** | ট্রেইনার ও মেম্বারের মাঝে সেশন নিয়ে বচসা মীমাংসা করা; ট্রেইনার ক্লায়েন্ট ভাগিয়ে বাইরে পার্সোনাল ট্রেনিং দেওয়া। | **Financial Transparency**: কোন ট্রেইনার কয়টি সেশন করাল, জিমের প্রফিট কত আর ট্রেইনারের কমিশন কত তা লাইভ দেখা। | মেম্বার ড্রপআউট; কমিশন গণনায় অতিরিক্ত টাকা দিয়ে ফেলা। | **PT Revenue +40% Boost**; শূন্য সংঘাত ও সম্পূর্ণ স্বয়ংক্রিয় পে-রোল। |
| **💪 Gym Trainer / PT** | মেম্বার শেষ মুহূর্তে না আসলে (No-Show) সেই দিনের সেশন কাউন্ট হবে কি না তা নিয়ে দ্বিধা; মাস শেষে কমিশন পেতে দেরি হওয়া। | **Mobile Punch-Card**: সেশন শেষ করেই ১-ট্যাপে পাঞ্চ করা এবং নিজের আর্নড কমিশন সাথে সাথে লাইভ ব্যালেন্সে দেখা। | ওনার কমিশন কেটে রাখা বা হিসাবে গরমিল করা। | স্বচ্ছ কমিশন ট্র্যাকিং ও ক্লায়েন্ট ধরে রেখে **মাসিক বাড়তি ৳১৫,০০০-৳২৫,০০০ আয়**। |
| **👨 Male Member (Bulking/Shred)** | ট্রেইনার ঠিক সময়ে ট্রেনিং দেয় কি না; কয়টি সেশন বাকি আছে তার কোনো রসিদ বা হিসেব না থাকা। | **Session Transparency**: প্রতি ক্লাসের পর হোয়াটসঅ্যাপে মেসেজ পাওয়া: *"Workout #6 complete, 6 remaining"*. | টাকা দিয়েও পুরো ১২টি ক্লাস না পাওয়া। | সঠিক গাইডে গোল অ্যাচিভ করা এবং সেশন শেষ হলে ডিসকাউন্টে রিনিউ করা। |
| **👩 Female Member (Fat Loss/Tone)** | ফিমেল ট্রেইনারের শিডিউল বুকিং ও প্রাইভেট লেডিস শিফটে নিয়মিত ট্র্যাকিং। | **Reliable Booking & Punch Log**: ট্রেইনারের সাথে সেশন হিসেব নিয়ে বিব্রতকর কথা বলতে না হওয়া। | সেশন চুরি বা ট্রেইনারের অনুপস্থিতি। | আত্মবিশ্বাসের সাথে লক্ষ্য অর্জন ও পার্সোনালাইজড কেয়ার। |
| **🏢 Front Desk Staff** | রিসেপশনে মেম্বারদের কমপ্লেইন হ্যান্ডেল করা; পিটি প্যাকেজ এনরোলমেন্টের রসিদ ম্যানুয়ালি লেখা। | ১-ট্যাপে পিটি প্যাকেজ সেল করা ও ট্রেইনার অ্যাসাইন করা। | ট্রেইনারের সাথে মেম্বারের বিরোধের দায় রিসেপশনের ওপর আসা। | মসৃণ বিলিং ও ইনস্ট্যান্ট পিটি ভাউচার তৈরি। |

---

## 3. The 5 Core PT Governance Pillars

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        GYMOS PT PUNCH-CARD & COMMISSION ENGINE                         │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. 🎟️ Digital Punch-Card │ 2. 📱 1-Tap WhatsApp     │ 3. 💰 Real-Time Commission       │
│    Matrix                │    Session Pass          │    Auto-Payroll Sync             │
│ • 12 / 24 / 36 Packs     │ • Instant push to member │ • Tiered Split (30% - 50%)       │
│ • Visual Stamp Grid      │ • Shows Remaining & Date │ • Instant Ledger Credit          │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. ⏰ 24-Hour Cancellation & No-Show Policy ("Burn" vs "Forgive" Rule)                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. 🔄 Trainer Reassignment & Session Transfer Engine (Zero Commission Leakage)         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Features vs. Benefits Matrix

| Feature | User Immediate Benefit | Gym Business ROI |
| :--- | :--- | :--- |
| **1. Digital Stamp Card Matrix** | Clear visual representation of completed vs remaining sessions. | **Zero Session Disputes:** 100% elimination of "I had sessions left" disputes. |
| **2. Instant WhatsApp Punch Receipt** | Members receive timestamped workout slips directly on WhatsApp. | **Fraud Prevention:** Stops ghost-punching and unauthorized commission inflation. |
| **3. Auto-Commission Payroll Sync** | Trainers immediately see earned commission in their monthly payroll. | **Staff Loyalty & PT Upselling:** Coaches proactively push PT renewals. |
| **4. No-Show & Late Cancel Policy** | Trainers can mark a session as "No-Show (Charged)" or "Forgiven". | **Professional Boundaries:** Protects trainer time and floor schedule. |
| **5. 10th-Session Auto-Renewal Offer** | Members receive timely renewal discounts before their package expires. | **Surging PT LTV:** Boosts PT package renewals from 35% to >70%. |

---

## 5. Technical Architecture & TypeScript Contracts

### TypeScript Schema (`types/gym.ts`)

```typescript
export type PTSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW_CHARGED' | 'CANCELLED_FORGIVEN';

export interface PTPunchRecord {
  id: string;
  sessionNumber: number; // e.g. 5
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  conductedByTrainerId: string;
  conductedByTrainerName: string;
  status: PTSessionStatus;
  workoutFocus?: string; // e.g. "Chest & Triceps Hypertrophy"
  trainerCommissionBdt: number; // e.g. ৳400
  notes?: string;
}

export interface PTPackageEnrollment {
  id: string; // e.g. "pt_pack_101"
  memberId: string;
  memberName: string;
  memberPhone: string;
  assignedTrainerId: string;
  assignedTrainerName: string;
  packageTitle: string; // e.g. "12-Session Fat Shred Elite"
  totalSessions: number; // 12 or 24
  completedSessions: number; // e.g. 5
  packagePriceBdt: number; // e.g. 12,000
  trainerCommissionTotalBdt: number; // e.g. 3,600 (30%)
  commissionPerSessionBdt: number; // e.g. 300
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'FROZEN';
  history: PTPunchRecord[];
}
```

---

## 6. UI / UX Wireframes & 30-Second Punch Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 🥊 PT PUNCH-CARD & TRAINER COMMISSION HUB                  │
├─────────────────────────────────────────────────────────────┤
│ 👤 Tanvir Hasan (#MEM-101) | 📱 01819-223344                │
│ 🎯 Package: 12-Session Fat Shred Elite | Coach: Alex        │
├─────────────────────────────────────────────────────────────┤
│ 🎟️ SESSION PROGRESS: 5 of 12 Completed (7 Remaining)       │
│ [✅][✅][✅][✅][✅][⭕][⭕][⭕][⭕][⭕][⭕][⭕]           │
│                                                             │
│ 💰 Commission Earned: ৳1,500 / ৳3,600 (৳300/session)       │
│ ⏳ Expires on: 15 Oct 2026 (44 Days Left)                   │
├─────────────────────────────────────────────────────────────┤
│ [ 🥊 Punch Session #6 ]    [ 💬 WhatsApp Session Slip ]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Edge Cases & Intelligent Safeguards

1. **Accidental Double-Punching:**
   * Safeguard: Prompts a warning modal if a coach punches a member twice in the same calendar day.
2. **Substitute Coach Delivery:**
   * Safeguard: Enables tagging a substitute coach on the fly; session commission routes directly to the substitute's wallet.
3. **Expired Packages:**
   * Safeguard: Locks package on expiry date with an owner-override `[ Extend 15 Days ]` action.

---

## 8. Automated WhatsApp Session Punch Receipt

```text
🥊 *PERSONAL TRAINING SESSION LOGGED!* 🏋️‍♂️
🏢 *IronForge Fitness Arena — Banani*
👤 Client: *Tanvir Ahmed* | Coach: *Coach Alex*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *SESSION COMPLETED: #5 OF 12*
📅 Date: 01 Sept 2026 (07:30 PM)
🎯 Focus: Chest Hypertrophy & Incline Dumbbell Press
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *PUNCH-CARD BALANCE:*
[✅][✅][✅][✅][✅][⭕][⭕][⭕][⭕][⭕][⭕][⭕]

⏳ *Sessions Remaining: 7 Classes*
🗓️ Package Validity: Valid until 15 Oct 2026

💬 *Coach Alex's Note:*
"Insane intensity on 80kg bench press today! Keep strict to your post-workout protein shake!"

— Powered by GymOS Personal Training Engine 🚀
```

---

## 9. Feature Prioritization Matrix

| Feature & Capability | Priority | Complexity | Revenue & Retention Impact | Milestone |
| :--- | :---: | :---: | :---: | :---: |
| **🎟️ Digital PT Punch-Card & Visual Stamp Matrix** | **P0** | Low | 🔥 Critical (Zero disputes) | Phase 1 (MVP) |
| **📱 1-Tap WhatsApp Session Punch Receipt** | **P0** | Low | 🔥 High (Anti-ghosting fraud) | Phase 1 (MVP) |
| **💰 Trainer Commission Auto-Credit to Payroll** | **P0** | Low | 💎 Critical (Staff transparency) | Phase 1 (MVP) |
| **⏰ No-Show Policy ("Deduct" vs "Forgive" Toggle)** | **P1** | Low | ⚡ High (Saves trainer time) | Phase 1 (MVP) |
| **🔄 10th-Session Auto-Renewal Incentive Tag** | **P1** | Low | 🚀 Massive (Doubles PT LTV) | Phase 1 (MVP) |
