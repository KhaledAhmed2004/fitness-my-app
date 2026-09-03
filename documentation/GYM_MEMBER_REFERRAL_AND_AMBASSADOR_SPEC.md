# 🎁 GymOS: Member Referral & Ambassador Growth Engine Specification
> **Document Code:** `GYM-SPEC-013-MEMBER-REFERRAL-AMBASSADOR`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Dual-Sided Referral System, VIP Guest Pass Dispatcher, Auto-Expiry Extension, Ambassador Hub & Fraud Protection  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & The Acquisition Problem](#1-executive-summary--the-acquisition-problem)
2. [Dual-Sided Incentive Architecture](#2-dual-sided-incentive-architecture)
3. [Stakeholder Impact Matrix](#3-stakeholder-impact-matrix)
4. [The 4 Core Architectural Pillars](#4-the-4-core-architectural-pillars)
5. [Technical Architecture & TypeScript Contracts](#5-technical-architecture--typescript-contracts)
6. [Business Rules & Fraud Prevention](#6-business-rules--fraud-prevention)
7. [WhatsApp Branded Invitation & Gratitude Slips](#7-whatsapp-branded-invitation--gratitude-slips)

---

## 1. Executive Summary & The Acquisition Problem

Fitness centers across Bangladesh spend significant capital on digital advertising with conversion rates hovering around 3–5%. Conversely, word-of-mouth member referrals yield conversion rates over **40%** and increase 6-month retention by **35%** (the "Gym Buddy Effect").

However, traditional referral processes fail due to:
- Lack of immediate recognition or reward for the referring member.
- Tedious manual paper logs at reception that are lost or forgotten.
- One-sided incentives that make referrers feel like salespeople.

**GymOS Referral & Ambassador Hub** transforms active members into motivated brand ambassadors by automating dual-sided rewards (15 days free extension for the referrer, waived admission fee for the friend), 1-tap WhatsApp VIP Guest Passes, and an automated thank-you slip generator.

---

## 2. Dual-Sided Incentive Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │              MEMBER (REFERRER: TANVIR)                 │
               │   Generates 1-Tap VIP Guest Pass: "TANVIR-455"         │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                     Shares via WhatsApp  │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │               FRIEND (REFEREE: FAHIM)                  │
               │  Receives: 100% Free Admission (Saves ৳1,000)          │
               │  + 3-Day VIP Workout Guest Pass                        │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                      Enrolls at Gym      │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             GYMOS AUTOMATION ENGINE                                      │
│  1. Verifies phone number & first-time applicant status.                                 │
│  2. Automatically extends Tanvir's expiry date by +15 DAYS.                              │
│  3. Dispatches WhatsApp Gratitude Slip to Tanvir: "Your friend Fahim enrolled!"          │
│  4. Upgrades Tanvir's Ambassador Badge (Bronze -> Silver -> Gold).                       │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stakeholder Impact Matrix

| Stakeholder | Traditional Pain Point | GymOS Transformation |
| :--- | :--- | :--- |
| **Gym Owner** | High CAC on digital ads; low retention of solo gym-goers. | Zero-cash-outlay member growth; buddy-system boosts retention. |
| **Reception Staff** | Manual tracking in diaries; frequent member disputes over rewards. | 1-tap referrer selection at admission; automated expiry calculation. |
| **Referring Member** | Never receives acknowledgment or tangible incentive for bringing friends. | Instant WhatsApp alert + 15 free gym days + ambassador status badge. |
| **Referred Friend** | Intimidation entering an unfamiliar gym; reluctance to pay admission fee. | Saves ৳1,000 admission fee and trains with an existing trusted buddy. |

---

## 4. The 4 Core Architectural Pillars

1. **Unique Code & VIP Guest Pass Generator:**
   - Every active member automatically receives an algorithmic code: `[FIRSTNAME]-[LAST3DIGITS]`, e.g., `TANVIR-455`.
2. **Dual-Sided Value Exchange:**
   - Referrer: +15 Days added to current membership expiry date.
   - Referee: ৳1,000 Admission Fee waived at checkout.
3. **Automated Gratitude & Notification Engine:**
   - When the friend enrolls, GymOS generates a personalized WhatsApp thank-you slip for the referrer.
4. **Ambassador Leaderboard & Gamification:**
   - Tiers: Bronze (1-2 referrals), Silver (3-4 referrals), Gold (5+ referrals).
   - Showcases the gym's top advocates in the Command Hub.

---

## 5. Technical Architecture & TypeScript Contracts

### Data Contracts (`types/gym.ts`):

```typescript
export type AmbassadorTier = 'MEMBER' | 'BRONZE_AMBASSADOR' | 'SILVER_AMBASSADOR' | 'GOLD_AMBASSADOR';

export interface GymReferralRecord {
  id: string;
  referrerMemberId: string;
  referrerMemberName: string;
  referrerCode: string;
  referredMemberId: string;
  referredMemberName: string;
  referredMemberPhone: string;
  enrolledDate: string; // YYYY-MM-DD
  packageTitle: string;
  rewardStatus: 'REWARDED' | 'REVOKED';
  rewardDescription: string; // e.g. "+15 Days Membership Extended"
}

export interface GymReferralSummary {
  totalReferralsCount: number;
  totalDaysRewarded: number;
  topReferrers: {
    memberId: string;
    memberName: string;
    phone: string;
    referralCount: number;
    tier: AmbassadorTier;
  }[];
}
```

---

## 6. Business Rules & Fraud Prevention

1. **First-Time Members Only:**
   - Referral discounts only apply to completely new phone numbers. Existing or past expired members cannot claim referee benefits.
2. **Anti-Collusion Verification:**
   - Front desk staff cannot assign referral credit after 48 hours of enrollment without owner authorization.
3. **Zero Cash Outlay Rule:**
   - Rewards are strictly non-cash (membership extension or juice bar vouchers) to protect gym cash flow and maintain brand premium.

---

## 7. WhatsApp Branded Invitation & Gratitude Slips

### A. VIP Guest Pass Shared by Member:
```text
🏋️‍♂️ *VIP GUEST PASS & ADMISSION VOUCHER* 🎟️
🏢 *IronForge Fitness Arena*
👤 Invited by: *Tanvir Ahmed* (VIP Code: *TANVIR-455*)

Hey Fahim! আমি IronForge Gym-এ রেগুলার ওয়ার্কআউট করছি। আমার এই ভিআইপি রেফারেল কোড নিয়ে আসলে তুমি পাবে:

✅ *১০০% ভর্তি ফি মাফ (৳১,০০০ Admission Fee FREE!)*
✅ *৩ দিনের ফ্রি ভিআইপি ট্রায়াল ওয়ার্কআউট*
✅ *ফ্রি বডি কম্পোজিশন ও বিএমআই টেস্ট*

📍 লোকেশন: লেভেল ৪, ধানমন্ডি ২৭, ঢাকা।
📱 অ্যাডমিশনের সময় ফ্রন্ট ডেস্কে কোডটি দেখাও: *TANVIR-455*

আজ বিকেলেই একসাথে ওয়ার্কআউট হোক! 💪
```

### B. Gratitude Alert to Referrer:
```text
🎉 *CONGRATULATIONS TANVIR AHMED!* 🎁
🏢 *IronForge Fitness Arena*

আপনার বন্ধু *Fahim Chowdhury* আজ আমাদের জিমে সফলভাবে ভর্তি হয়েছেন! 🤝

🌟 আপনার অবদানের উপহার হিসেবে আপনার মেম্বারশিপে *১৫ দিনের ফ্রি এক্সটেনশন* যোগ করা হয়েছে!
📅 আপনার নতুন এক্সপায়ারি ডেট: *15-Oct-2026*

IronForge ফ্যামিলিকে বড় করতে সাহায্য করায় আপনাকে আন্তরিক ধন্যবাদ! Keep Inspiring! 🚀
```
