# 🧾 GymOS: Petty Cash Governance, Digital Vouchers & Anti-Leakage Guard Specification
> **Document Code:** `GYM-SPEC-007-PETTY-CASH-GOVERNANCE`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Gym Owner Financial Command, Petty Cash Governance & Digital Vouchers  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & The "Death by a Thousand Papercuts"](#1-executive-summary--the-death-by-a-thousand-papercuts)
2. [Stakeholder Analysis Matrix](#2-stakeholder-analysis-matrix)
3. [The 5 Core Anti-Leakage Pillars](#3-the-5-core-anti-leakage-pillars)
4. [Features vs. Benefits Matrix](#4-features-vs-benefits-matrix)
5. [Technical Architecture & TypeScript Schemas](#5-technical-architecture--typescript-schemas)
6. [UI / UX Wireframes & 3-Second Quick Catalog Workflow](#6-ui--ux-wireframes--3-second-quick-catalog-workflow)
7. [Edge Cases & Intelligent Safeguards](#7-edge-cases--intelligent-safeguards)
8. [Automated WhatsApp Petty Cash Expense Digest](#8-automated-whatsapp-petty-cash-expense-digest)
9. [Feature Prioritization Matrix](#9-feature-prioritization-matrix)

---

## 1. Executive Summary & The "Death by a Thousand Papercuts"

While large financial thefts (such as pocketing full annual membership fees) are easily detected due to member invoice demands, the most devastating financial drain in commercial gym operations is **untracked petty cash micro-leakage** (ক্ষুদ্র ক্ষরণের মহাবিপদ).

```
                  THE 30-DAY INVISIBLE CASH BLEED (BDT)
┌───────────────────────────┬──────────────┬──────────────┬──────────────────┐
│ Daily Expense Item        │ Actual Cost  │ Logged Cost  │ Monthly Leakage  │
├───────────────────────────┼──────────────┼──────────────┼──────────────────┤
│ 2x Drinking Water Jars    │ ৳ 160        │ ৳ 220        │ ৳ 1,800          │
│ Sweeper / Cleaner Tip     │ ৳  50        │ ৳ 100        │ ৳ 1,500          │
│ Cleaning Detergent / Mop  │ ৳ 250        │ ৳ 400        │ ৳ 2,250          │
│ Electrical Tape / Bulb    │ ৳ 120        │ ৳ 250        │ ৳ 1,950          │
│ Front-Desk Staff Tea/Snack│ ৳  40        │ ৳ 150        │ ৳ 3,300          │
├───────────────────────────┴──────────────┴──────────────┼──────────────────┤
│ 💸 TOTAL ESTIMATED MONTHLY PHANTOM LEAKAGE PER BRANCH:  │ ৳ 10,800 / Month │
└─────────────────────────────────────────────────────────┴──────────────────┘
```

### 🛠️ Existing Manual Workarounds & Their Fatal Flaws:
1. **The Verbal Voucher Lie (ভাউচারবিহীন মৌখিক দাবি):** Staff verbally state end-of-day expenses (*"Bhai, 2 water jars, cleaner tips, washroom soap — ৳650 spent"*) without paper vouchers or vendor verification.
2. **Price Inflation on Non-Standard Items (দাম ফুলিয়ে বলা):** Buying a ৳80 detergent packet from the local bazaar and claiming ৳150 from the cash drawer.
3. **Cash Co-Mingling (ইমপ্রেস ফান্ডের অভাব):** Mixing large membership admission revenues (৳50,000+) with everyday petty cash in a single drawer makes pilferage trivial.
4. **Trust Breakdown & Accusations (স্টাফদের মানসিক অসন্তোষ):** Honest staff who genuinely spend money without receipts feel unfairly suspected, causing friction and staff turnover.

**GymOS Petty Cash Governance Engine** establishes an airtight, zero-friction petty cash protocol featuring **pre-approved vendor rate catalogs**, a **3-tier spend approval gate**, dedicated **virtual petty envelopes**, and **1-tap WhatsApp audit digests**.

---

## 2. Stakeholder Analysis Matrix

| Stakeholder | Core Pain Points | Key Needs & Expectations | Risks & Fears | Desired Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **🏋️ Gym Owner** | প্রতি মাসে ১০,০০০ থেকে ২৫,০০০ টাকা পেটি ক্যাশের নামে হাওয়া হয়ে যাওয়া; প্রমাণ ছাড়া কাউকে কিছু বলা যায় না। | **স্বচ্ছতা ও প্রি-ফিক্সড রেট**: খরচ হওয়ার সাথে সাথে ফোনে ভাউচার নোটিফিকেশন ও ফটো প্রুফ পাওয়া। | কর্মচারীরা অসন্তুষ্ট হবে বা বেশি কড়াকড়ি করলে জিমের কাজ আটকে থাকবে। | **Zero Phantom Expenses**; প্রতি পয়সার ডিজিটাল প্রমাণ ও অডিট ট্রেইল। |
| **👔 Shift Manager** | বাজার থেকে কেনাকাটার পর রসিদ হারিয়ে গেলে বা মেমো না দিলে ওনারের কাছে জবাবদিহি করতে কষ্ট হয়। | **১০-সেকেন্ডের মোবাইল ভাউচারিং**: ক্যামেরা দিয়ে মেমোর ছবি তুলে এক ক্লিকে খরচ সাবমিট করা। | খরচ ওনার রিজেক্ট করলে পকেট থেকে টাকা গচ্চা যাওয়া। | পরিষ্কার হিসাব দিয়ে নিজের সততা প্রমাণ করা এবং নির্বিঘ্নে শিফট হ্যান্ডওভার করা। |
| **🧹 Sweeper / Cleaner** | কোনো লিখিত মেমো দিতে পারে না; প্রায়ই টাকা কম পায় বা দেরিতে পায়। | ক্লিনিং সাপ্লাইয়ের জন্য নির্দিষ্ট বাজেট পাওয়া। | চুরির মিথ্যে অপবাদ পাওয়া। | সময়মতো ন্যায্য মজুরি ও বকশিশ পাওয়া। |
| **🔧 Electrician / Tech** | তাৎক্ষণিক কাজ করে নগদ টাকা নিয়ে চলে যায়, ইনভয়েস দেওয়ার সময় থাকে না। | সার্ভিস দেওয়ার সাথে সাথে ডিজিটাল ক্যাশ ভাউচারে সাইন/কনফার্মেশন। | বিল আটকে যাওয়া। | কাজের সাথে সাথে ক্যাশ পেমেন্ট পাওয়া। |
| **🏃 General Member** | পেটি ক্যাশ না থাকার অজুহাতে ফিল্টারে পানি না থাকা বা ওয়াশরুম অপরিষ্কার থাকা। | সবসময় পরিষ্কার ফ্লোর, ঠান্ডা খাবার পানি ও এসি সচল পাওয়া। | সার্ভিস কোয়ালিটি ড্রপ করা। | প্রিমিয়াম হাইজিন ও ওয়ার্কআউট পরিবেশ। |

---

## 3. The 5 Core Anti-Leakage Pillars

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PETTY CASH ANTI-LEAKAGE GUARD ENGINE                            │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. 🏷️ Fixed Rate Catalog │ 2. 📸 Snap-a-Receipt     │ 3. 🚦 3-Tier Spend Approval Gate │
│ • Pre-approved standard  │ • Instant Camera Snap    │ • Tier 1 (<৳200): Instant Auto   │
│   prices (Water = ৳80)   │ • Compresses to 100KB    │ • Tier 2 (৳200-৳500): Photo Req  │
│ • Stops Price Inflation  │ • Visual Audit Evidence  │ • Tier 3 (>৳500): Owner OTP/Appr │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. 💼 Virtual Petty Cash Envelope (Imprest System)                                     │
│ • Separates Day's Membership Inflow Cash from ৳2,000 Petty Cash Allowance              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. ⚠️ Daily Spend Limit Cap (e.g. Max ৳1,500/day without Owner Bypass PIN)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: 🏷️ Pre-Approved Vendor & Item Price Catalog (প্রাইস ক্যাপ ক্যাটালগ)
* **Mechanism:** Dropdown catalog of standard gym operating items:
  * `Kinley 20L Water Jar (Fixed: ৳80/jar)`
  * `Floor Disinfectant & Mop Head (Fixed: ৳150)`
  * `Front-Desk Staff Refreshment Allowance (Capped: ৳50/shift)`
* **Value:** 100% eliminates price inflation and arbitrary price entries.

### Pillar 2: 🚦 3-Tier Spend Approval Gate (স্মার্ট থ্রেশহোল্ড গেট)
* **Tier 1 (Micro-Expenses < ৳200):** Water jars / tea / informal tips — **Instant Auto-Approval (Zero Friction)**.
* **Tier 2 (Medium Expenses ৳200 – ৳500):** Detergent / bulbs / stationery — **Mandatory Photo Receipt Snap**.
* **Tier 3 (Large Expenses > ৳500):** Fan repairs / plumbing / AC servicing — **Manager Emergency PIN / Owner WhatsApp Approval**.
* **Value:** Low-cost operations move smoothly without bureaucracy, while high-value expenses cannot be drained without authorization.

### Pillar 3: 💼 Virtual Petty Cash Envelope (ইমপ্রেস ফান্ড সিস্টেম)
* **Mechanism:** Daily membership cash collections (৳50,000+) are kept untouched in the main vault. Routine expenses are deducted strictly from a dedicated **`৳2,000` Petty Cash Allowance Envelope**.
* **Value:** Restricts potential cash exposure to the exact float amount.

### Pillar 4: 📸 5-Second Camera Receipt Snap (ইনস্ট্যান্ট ফটো ভাউচার)
* **Mechanism:** In-app camera integration that captures, compresses (under 100KB), and attaches vendor receipts to unique voucher IDs (`#PV-1082`).
* **Value:** Permanent, paperless audit evidence for accountant reviews.

### Pillar 5: ⚠️ Daily Spend Limit Cap & Over-Budget Alerts
* **Mechanism:** Enforces a hard budget ceiling (e.g. `৳1,500/day`). If cumulative daily petty cash exceeds this limit, subsequent requests trigger an **Over-Budget Warning** requiring manager PIN authorization.
* **Value:** Prevents gradual budget overruns over the course of the month.

---

## 4. Features vs. Benefits Matrix

| Feature | Engineering Mechanism | User Immediate Benefit | Gym Owner Business ROI |
| :--- | :--- | :--- | :--- |
| **1. Pre-Approved Price Catalog** | One-tap selection with pre-defined unit rates. | Staff logs expenses in 3 seconds without manual typing. | **Price Inflation Eliminated:** Saves ৳8,000–৳15,000 monthly in inflated receipts. |
| **2. 3-Tier Spend Gate** | Threshold conditional logic (`<৳200`, `৳200-500`, `>৳500`). | Small routine expenses are never delayed. | **Fraud Prevention:** High-value drains are blocked automatically. |
| **3. Snap-a-Receipt Camera** | Camera capture module with local image caching. | No lost paper bills or fading thermal receipts. | **Auditable Records:** 100% digital proof for tax and accounting audits. |
| **4. Imprest Petty Envelope** | Dedicated float state tracking (`remainingPettyFloatBdt`). | Clear separation between day's sales and expense cash. | **Controlled Risk:** Drawer cash is safe from uncontrolled dipping. |
| **5. 1-Tap Daily Expense Digest** | Formatted WhatsApp summary compiler. | Staff submits itemized vouchers in one tap at closing. | **Peace of Mind:** Complete transparency before bedtime. |

---

## 5. Technical Architecture & TypeScript Schemas

### A. TypeScript Schema Contracts (`types/gym.ts`)

```typescript
export type PettyVoucherStatus = 'APPROVED' | 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface GymPettyCatalogItem {
  id: string;
  category: PettyExpenseCategory;
  name: string; // e.g. "Kinley 20L Water Jar"
  standardRateBdt: number; // e.g. 80
  unit: string; // e.g. "per jar", "per pack"
  icon: string;
  isPopular?: boolean;
}

export interface GymPettyCashVoucher {
  id: string;
  voucherNumber: string; // e.g. "PV-2026-0901-01"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  category: PettyExpenseCategory;
  catalogItemId?: string;
  amountBdt: number;
  paidFrom: 'PETTY_ENVELOPE' | 'CASH_DRAWER' | 'BKASH_MERCHANT' | 'OWNER_POCKET';
  spentBy: string; // Staff Name
  recipientName?: string; // e.g. "Kinley Delivery Agent"
  hasReceiptPhoto: boolean;
  receiptPhotoUri?: string;
  approvalStatus: PettyVoucherStatus;
  approvedBy?: string;
  notes?: string;
}

export interface GymPettyEnvelopeStatus {
  totalAllocatedFloatBdt: number; // e.g. ৳ 3,000
  currentRemainingBalanceBdt: number; // e.g. ৳ 1,850
  totalSpentThisMonthBdt: number; // e.g. ৳ 14,200
  todaySpentBdt: number; // e.g. ৳ 650
  dailySpendLimitBdt: number; // e.g. ৳ 1,500
}
```

---

## 6. UI / UX Wireframes & 3-Second Quick Catalog Workflow

### A. 3-Second Quick Catalog Logger Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ QUICK PETTY EXPENSE LOGGER                               │
├─────────────────────────────────────────────────────────────┤
│ 💼 PETTY ENVELOPE:  ৳ 1,350 REMAINING / ৳ 2,000             │
│                                                             │
│ 🏷️ POPULAR PRE-APPROVED ITEMS:                              │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ 🥤 Kinley 20L Jar    │  │ 🧹 Floor Detergent   │          │
│ │    ৳ 80 / jar        │  │    ৳ 150 / pack      │          │
│ └──────────────────────┘  └──────────────────────┘          │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ ☕ Staff Refreshment │  │ 💡 LED Bulb (15W)    │          │
│ │    ৳ 50 / shift      │  │    ৳ 180 / unit      │          │
│ └──────────────────────┘  └──────────────────────┘          │
│                                                             │
│ Quantity: [ - ]  2  [ + ]     Total: ৳ 160 (Tier 1: Fast)   │
│ Recipient: [ Kinley Delivery Agent                 ]        │
│                                                             │
│ [ 📷 Attach Receipt (Optional) ]                            │
│                                                             │
│ [ ⚡ LOG VOUCHER (#PV-03) (1-Tap Save) ]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Edge Cases & Intelligent Safeguards

```
[ Staff Logs Petty Expense ]
             │
             ▼
   ┌───────────────────┐
   │ Enter Amount (৳)  │
   └───────────────────┘
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ <= ৳200 ]       [ > ৳500 ]
(Tier 1: Fast)    (Tier 3: High Value)
   │                   │
   │                   ▼
   │          ┌───────────────────────┐
   │          │ Require Photo Receipt │
   │          │ + Manager PIN / OTP   │
   │          └───────────────────────┘
   │                   │
   └─────────┬─────────┘
             ▼
   ┌───────────────────┐
   │ Deduct from Petty │
   │ Envelope Balance  │
   └───────────────────┘
             │
             ▼
   ┌───────────────────┐
   │ Generate Voucher: │
   │ #PV-2026-0901-01  │
   └───────────────────┘
```

1. **Street Vendors with Zero Paper Receipts (রসিদবিহীন কেনাকাটা):**
   * Staff enables **"Informal Vendor / No Receipt"** toggle and enters the recipient's name (e.g. *"Kashem Cleaner"*), maintaining accountability without stalling.
2. **Midnight Emergency Repairs (রাত ৯:৩০-এ জরুরি মেরামত):**
   * Electrician or plumber demands cash immediately. Manager uses **"Manager Emergency PIN Override"**, unlocking the cash while dispatching a high-priority alert to the owner.
3. **Petty Envelope Depletion (পেটি ক্যাশ শেষ হয়ে যাওয়া):**
   * If the ৳2,000 envelope reaches ৳0, system allows **"Borrow from Main Revenue Drawer"** logged as an inter-account float transfer.
4. **Offline Mode & Image Caching:**
   * Receipt photos are cached locally in app storage and synced to the cloud when Wi-Fi is restored.

---

## 8. Automated WhatsApp Petty Cash Expense Digest

At the end of the shift or upon closing, the system formats and launches the complete itemized voucher digest:

```text
🧾 *IRONFORGE FITNESS ARENA — DAILY PETTY EXPENSE AUDIT* 🔍
📅 Date: 01 September 2026 | ⏰ Shift: Full Day
👤 Logged By: Manager Tareq | 🏢 Branch: Dhanmondi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 *TODAY'S TOTAL PETTY OUTFLOW: ৳ 650*
💼 Petty Envelope Balance: ৳ 1,350 / ৳ 2,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *ITEMIZED VOUCHER BREAKDOWN:*

1️⃣ [#PV-01] *2x Kinley 20L Water Jars*
   • Category: 🥤 Refreshments & Utilities
   • Amount: ৳ 160 (Fixed Catalog Rate: ৳80/jar)
   • Spent By: Tareq | Paid to: Kinley Delivery Agent
   • Proof: 📷 Photo Receipt Verified

2️⃣ [#PV-02] *Floor Cleaner & Mop Head*
   • Category: 🧹 Supplies & Cleaning
   • Amount: ৳ 350
   • Spent By: Shuvo (Staff) | Paid to: CleanCare Store
   • Proof: 📷 Cash Memo #481 attached

3️⃣ [#PV-03] *Emergency Washroom Lock Latch*
   • Category: 🔧 Maintenance & Hardware
   • Amount: ৳ 140
   • Spent By: Tareq | Paid to: Bhai Bhai Hardware
   • Proof: ✍️ Staff Verified (Informal Vendor)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *BUDGET COMPLIANCE:*
• Daily Limit: ৳ 1,500 | Used: ৳ 650 (43%) ✅
• Variance / Over-Budget: ৳ 0 (OPTIMAL)

🔒 *All vouchers cryptographically signed & archived.*
— GymOS Audit Engine
```

---

## 9. Feature Prioritization Matrix

| Feature & Capability | Priority | Complexity | Anti-Theft Impact | Target Milestone |
| :--- | :---: | :---: | :---: | :---: |
| **🏷️ Pre-Approved Price Catalog & Dropdown** | **P0** | Low | 🔥 High (Stops inflation) | Phase 1 (MVP) |
| **🚦 3-Tier Spend Limits (<৳200, ৳200-500, >৳500)** | **P0** | Low | 🔥 High (Controls big spills) | Phase 1 (MVP) |
| **🧾 Unique Digital Voucher Generator (`#PV-1082`)** | **P0** | Very Low | 💎 High (Auditability) | Phase 1 (MVP) |
| **💼 Dedicated Petty Cash Envelope Tracking** | **P1** | Medium | 💎 High (Separates revenue) | Phase 1 (MVP) |
| **📸 Camera Photo Receipt Snap & Compression** | **P1** | Medium | 💎 High (Visual proof) | Phase 2 |
| **🚨 Instant WhatsApp OTP for Expenses > ৳1,000** | **P2** | Medium | ⚡ Medium (Remote safety) | Phase 2 |
| **🤖 Vendor Auto-Suggest via GPS / Local Store** | **Future**| High | ⚡ Medium (Convenience) | Future |

---

## 🏁 Sign-Off & Approvals
* **Product Manager:** Principal GymOS Architect  
* **Lead Financial Engineer:** Senior Commercial Systems Specialist  
* **Auditing Advisor:** Commercial Gym Financial Auditor  
* **Target Release:** GymOS Core v2.7
