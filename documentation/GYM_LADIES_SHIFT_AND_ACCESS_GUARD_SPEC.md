# 🚺 GymOS: Shift & Ladies Hour Timing Guard Specification
> **Document Code:** `GYM-SPEC-004-SHIFT-GUARD`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Gym Owner & Front-Desk Floor Command Hub  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & Cultural Reality](#1-executive-summary--cultural-reality)
2. [Stakeholder Analysis & Core Pain Points](#2-stakeholder-analysis--core-pain-points)
3. [Catastrophic Failure Scenarios](#3-catastrophic-failure-scenarios)
4. [Features vs. Benefits Matrix](#4-features-vs-benefits-matrix)
5. [Technical Architecture & State Schemas](#5-technical-architecture--state-schemas)
6. [UI / UX Wireframes & Interaction Flows](#6-ui--ux-wireframes--interaction-flows)
7. [Edge Cases & Intelligent Safeguards](#7-edge-cases--intelligent-safeguards)
8. [Automated WhatsApp Shift Broadcast Templates](#8-automated-whatsapp-shift-broadcast-templates)

---

## 1. Executive Summary & Cultural Reality

In Bangladesh and broader South Asian commercial fitness facilities, **over 95% of unisex gyms operate with dedicated female-only shifts ("Ladies Hours")**. 

In conservative and privacy-conscious communities, female athletes require **100% privacy and psychological comfort** (curtains drawn, dedicated female instructors, female cleaning staff, and strict zero-male presence on the workout floor).

### The Operational Challenge:
Commercial gyms rely heavily on manual human observation at reception. During peak rush hours, shift transitions, or staff distraction, accidental male intrusions occur. This single issue is the **#1 driver of female member dropouts, family complaints, and reputational damage** for gym owners.

**GymOS Shift Guard** introduces an automated, time-aware, gender-matching gatekeeper directly into the 2-Second Front-Desk Check-In Terminal and Owner Command Hub.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SHIFT GUARD ARCHITECTURE                                │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. Dynamic Shift Engine  │ 2. Terminal Access Guard │ 3. Real-Time Shift Radar         │
│ • Ladies Only Windows    │ • Automatic Gender Match │ • Live Status Pill on Home       │
│ • Gents Only Windows     │ • Loud Haptic Intercept  │ • Countdown to Next Shift        │
│ • Friday Prayer Overrides│ • Next Shift Countdown   │ • Rush-Hour Density Indicator    │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## 2. Stakeholder Analysis & Core Pain Points

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     FEMALE ATHLETES     │      MALE ATHLETES      │    GYM OWNER & STAFF    │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • গোপনীয়তা ভঙ্গের ভয়     │ • ভুল সময়ে এসে সময় নষ্ট │ • নারী মেম্বারদের অসন্তোষ│
│ • পুরুষ উপস্থিতিতে অস্বস্তি│ • টাইমিং নিয়ে বিভ্রান্তি │ • ফ্লোরে অনাকাঙ্ক্ষিত ঝামেলা│
│ • ড্রপআউট / জিম ছাড়া   │ • রিসেপশনে তর্কাতর্কি    │ • ম্যানুয়াল নজরদারির ক্লান্তি │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### A. Female Athletes (নারী সদস্যবৃন্দ)
* **Fear of Exposure & Privacy Violations:** Inadvertent entry of male members during workouts ruins workout focus and breaches religious/cultural comfort.
* **Uncertainty of Shift Hours:** Confusion regarding shift start/end times (especially on weekends or Fridays).

### B. Male Athletes (পুরুষ সদস্যবৃন্দ)
* **Wasted Commutes:** Commuting 30–60 minutes through city traffic only to discover the gym is currently in Ladies Shift.
* **Awkward Confrontations:** Embarrassment when stopped verbally by reception staff in front of other members.

### C. Reception Staff & Gym Owners
* **Staff Hesitation / Conflict:** Difficult for young receptionists to stop influential, senior, or aggressive male members verbally.
* **Financial Loss:** Female members have the highest Lifetime Value (LTV) and Personal Training (PT) conversion rates; losing them hurts profitability.

---

## 3. Catastrophic Failure Scenarios

| Scenario | Root Cause | Impact on Business | GymOS Solution |
| :--- | :--- | :--- | :--- |
| **Accidental Floor Walk-in** | Receptionist busy making shake/taking cash; male member slips in at 11:15 AM. | Female members leave immediately; negative reviews on social media. | **Terminal Alarm & Sound:** Terminal blocks check-in with red flashing alert and vocal/haptic warning. |
| **Early Arrival Bottleneck** | Male athletes arrive at 12:40 PM for a 1:00 PM shift and loiter near the door. | Female members feel watched while exiting the locker room. | **Live Shift Radar:** Shows exact remaining minutes (`⏳ 20 mins left in Ladies Shift`). |
| **Friday Schedule Chaos** | Friday Jummah prayer shifts timing by 1 hour; members unaware. | 20+ members arrive at the wrong hour. | **Friday Override Engine:** Configurable Jummah/Special Friday shift schedules. |

---

## 4. Features vs. Benefits Matrix

| Feature | Engineering Mechanism | Owner ROI & Business Value |
| :--- | :--- | :--- |
| **1. Configurable Shift Schedule** | JSON-backed shift array with start/end time, target gender (`FEMALE`, `MALE`, `UNISEX`), and day filters. | Flexible for any gym's business model (Unisex, Mixed, Ladies-First). |
| **2. 2-Sec Terminal Guard** | Evaluates `member.gender` vs `currentShift.allowedGender` during QR/Search check-in. | Zero human error; 100% automated floor security. |
| **3. Live Shift Status Radar** | Real-time reactive ribbon in Tab 1 & Check-in screen with active shift badge and countdown. | Staff and coaches instantly know floor occupancy state at a glance. |
| **4. Manager Override PIN** | 4-digit master PIN (`1234` or custom) to permit emergency maintenance staff or trainers. | Prevents system lockups during operational emergencies. |
| **5. Pre-Arrival WhatsApp Pass** | Member digital pass and automated WhatsApp reminders include gender-specific shift hours. | Prevents members from traveling at wrong hours; eliminates complaints. |

---

## 5. Technical Architecture & State Schemas

### A. TypeScript Type Definitions (`types/gym.ts`)

```typescript
export type GymShiftType = 'LADIES_ONLY' | 'GENTS_ONLY' | 'UNISEX_MIXED';

export interface GymShiftScheduleItem {
  id: string;
  name: string; // e.g. 'Morning Ladies Prime', 'Evening Gents Rush'
  shiftType: GymShiftType;
  allowedGenders: ('MALE' | 'FEMALE' | 'OTHER')[];
  startTime: string; // '10:00' (24-hour format)
  endTime: string;   // '13:00'
  daysApplicable: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[];
  isActive: boolean;
}

export interface GymShiftStatusSnapshot {
  currentShift: GymShiftScheduleItem | null;
  shiftType: GymShiftType;
  label: string;
  remainingMinutes: number;
  nextShift: GymShiftScheduleItem | null;
  nextShiftStartsInMinutes: number;
  isAccessAllowed: (gender: 'MALE' | 'FEMALE' | 'OTHER') => boolean;
}
```

### B. Shift Evaluation Algorithm

$$\text{Current Time} = H \times 60 + M$$
$$\text{Shift Window} = [S_{\text{start}} \times 60 + M_{\text{start}}, S_{\text{end}} \times 60 + M_{\text{end}}]$$
$$\text{Is Allowed} = (\text{Shift Type} == \text{UNISEX}) \lor (\text{Member Gender} \in \text{Shift Allowed Genders})$$

---

## 6. UI / UX Wireframes & Interaction Flows

### A. Check-In Terminal Guard (Interception Modal)

```
┌─────────────────────────────────────────────────────────────┐
│ ⛔ ACCESS RESTRICTED — SHIFT TIMING CONFLICT                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       ⚠️  CURRENTLY ACTIVE: 🚺 LADIES SHIFT                 │
│           Shift Hours: 10:00 AM — 01:00 PM                  │
│                                                             │
│   ┌───────┐   TANVIR AHMED (Male Athlete)                   │
│   │ 📸    │   Member ID: #IF-2026-0842                      │
│   │ PHOTO │   Plan: 6-Month VIP Pass (Active)               │
│   └───────┘                                                 │
│                                                             │
│   ❌ Floor entry denied due to female privacy guidelines.   │
│   ⏳ Next Gents Shift starts at 01:00 PM (in 38 mins).       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [ 🔙 Back to Check-In ]     [ 🔑 Manager Override ]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### B. Live Shift Radar Ribbon (Home & Check-In Station)

```
┌─────────────────────────────────────────────────────────────┐
│  ⏰ LIVE SHIFT RADAR                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🚺 LADIES ONLY SHIFT ACTIVE         10:00 AM - 01:00 PM│  │
│  │ ⏳ 42 mins remaining • Next: 🚹 Gents Shift (01:00 PM) │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Edge Cases & Intelligent Safeguards

1. **Manager / Maintenance Override:**
   * If a male electrician, AC repair technician, or the gym owner needs urgent entry during a Ladies Shift, tapping **`[ 🔑 Manager Override ]`** prompts for the owner security PIN, logs the override reason, and allows temporary check-in.
2. **Friday Jummah Prayer Adjustments:**
   * Automatic Friday scheduling where morning shifts end at 12:00 PM for prayer preparation and resume at 02:30 PM.
3. **Transition Buffer (10-Minute Cooldown):**
   * A 10-minute transition warning appears 10 minutes before Ladies Shift begins (`09:50 AM`) prompting male members on the floor to wrap up workouts and head to locker rooms.
4. **Member Self-Verification:**
   * When female or male members check their **Digital Member ID Pass**, their permitted shift timings are highlighted in emerald green.

---

## 8. Automated WhatsApp Shift Broadcast Templates

### A. General Shift Schedule Notice

```text
⏰ *IronForge Fitness Arena — অফিশিয়াল জিম শিফট নোটিশ*

আসসালামু আলাইকুম মেম্বারবৃন্দ,
আমাদের সম্মানিত সকল মেম্বারের সর্বোচ্চ স্বাচ্ছন্দ্য ও নারী সদস্যদের শতভাগ গোপনীয়তা নিশ্চিত করতে নির্ধারিত শিফট শিডিউল নিচে দেওয়া হলো:

🚺 *লেডিস শিফট (মহিলাদের সংরক্ষিত সময়):*
• সকাল ১০:০০ AM – দুপুর ০১:০০ PM (প্রতিদিন)
• দুপুর ০২:৩০ PM – বিকাল ০৫:০০ PM (সোম ও বুধ)

🚹 *জেন্টস শিফট (পুরুষদের নির্ধারিত সময়):*
• সকাল ০৬:০০ AM – সকাল ১০:০০ AM
• বিকাল ০৫:০০ PM – রাত ১১:০০ PM

🕌 *শুক্রবার স্পেশাল শিডিউল:*
• জেন্টস: সকাল ০৬:০০ AM – সকাল ১০:০০ AM
• লেডিস: সকাল ১০:০০ AM – দুপুর ১২:০০ PM
• জুম্মার বিরতি: দুপুর ১২:০০ PM – দুপুর ০২:৩০ PM
• ইভনিং জেন্টস: দুপুর ০২:৩০ PM – রাত ১১:০০ PM

⚠️ *অনুরোধ:* অনুগ্রহ করে নির্ধারিত শিফট ব্যতীত অন্য সময়ে ফ্লোরে প্রবেশ করবেন না। আমাদের ফ্রন্ট-ডেস্ক টার্মিনাল স্বয়ংক্রিয়ভাবে শিফট অনুযায়ী এন্ট্রি অনুমোদন করে।

সুস্থ থাকুন, নিয়মিত ওয়ার্কআউট করুন! 💪🔥
— Management, IronForge Fitness Arena
📍 Dhanmondi Branch, Dhaka | 📞 +880 1711-001122
```

---

## 🏁 Sign-Off & Approvals
* **Product Manager:** Lead GymOS Architect  
* **UX/UI Specialist:** Senior Mobile Designer  
* **Domain Advisor:** Commercial Fitness Owner & Operations Consultant  
* **Target Release:** GymOS Core v2.4
