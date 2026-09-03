# 📊 GymOS: Staff Allowances & Daily Operational OPEX Engine Specification
> **Document Code:** `GYM-SPEC-008-STAFF-ALLOWANCE-AND-DAILY-OPEX`  
> **Status:** `APPROVED FOR IMPLEMENTATION`  
> **Module:** Gym Staff Ledger, Daily Operational Expenses (OPEX), Generator Fuel & Net Cash Flow  
> **Target Platforms:** iOS, Android, Web (Expo SDK 54 / React Native)

---

## 📑 Table of Contents
1. [Executive Summary & The "Fragmented Expense Chaos"](#1-executive-summary--the-fragmented-expense-chaos)
2. [Stakeholder Analysis Matrix](#2-stakeholder-analysis-matrix)
3. [The 4 Core Operational & Staff Expense Pillars](#3-the-4-core-operational--staff-expense-pillars)
4. [Features vs. Benefits Matrix](#4-features-vs-benefits-matrix)
5. [Technical Architecture & TypeScript Contracts](#5-technical-architecture--typescript-contracts)
6. [UI / UX Wireframes & 3-Second OPEX Logger](#6-ui--ux-wireframes--3-second-opex-logger)
7. [Edge Cases & Intelligent Safeguards](#7-edge-cases--intelligent-safeguards)
8. [Automated WhatsApp Daily OPEX & Staff Settlement Dossier](#8-automated-whatsapp-daily-opex--staff-settlement-dossier)
9. [Feature Prioritization Matrix](#9-feature-prioritization-matrix)

---

## 1. Executive Summary & The "Fragmented Expense Chaos"

While membership revenue collection is simple to monitor through digital check-ins, commercial gym owners in Bangladesh face persistent financial drain from **untracked staff daily allowances, forgotten salary advances, unmonitored generator diesel expenses, and ad-hoc operational outflows** (দৈনিক অপারেশনাল ও স্টাফ খরচের বিশৃঙ্খলা).

```
                  THE DAILY GYM OPEX CHAOS (BANGLADESH REALITY)
┌──────────────────────────────────────┬─────────────────┬──────────────────────────────────────┐
│ Expense Type                         │ Frequency / Avg │ Common Real-World Pain Point         │
├──────────────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ ⛽ Generator Diesel (Load Shedding)   │ 2-3x / week     │ ৳1,500 cash given; diesel receipt is │
│                                      │ (৳1,200 - ৳2,500│ a hand-scrawled slip from petrol pump│
├──────────────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ 🥪 Staff Daily Tiffin / Food Allowance│ Daily           │ 3 trainers + 2 staff x ৳60/day = ৳300│
│                                      │ (৳300 / day)    │ No monthly cap; scales out of control│
├──────────────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ 💸 Staff Salary Advance (হাতে ধার)   │ 1-2x / week     │ Staff asks ৳500 advance; owner forgets│
│                                      │ (৳500 - ৳2,000) │ at month-end salary payout time!     │
├──────────────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ 🚛 Stadium Market Transport / Parts  │ As needed       │ Trainer goes to Gulistan to buy cable│
│                                      │ (৳450 - ৳1,200) │ Rickshaw + parts money mixed up      │
├──────────────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ 🗑️ City Corp / Cleaner Waste Fee    │ Weekly / Monthly│ Informal collector demands ৳500 cash;│
│                                      │ (৳300 - ৳800)   │ No official voucher exists           │
└──────────────────────────────────────┴─────────────────┴──────────────────────────────────────┘
```

### 🛠️ Core Problems Solved:
1. **The Post-It Note / Torn Notebook Trap (টুকরো কাগজের খাতা):** Replaces faded, easily lost paper entries with an immutable digital ledger.
2. **Salary Advance Payout Disputes (বেতনের সময় মারামারি):** Automatically links mid-month cash advances directly to staff payroll profiles, preventing forgotten deductions.
3. **Net Profit Blindness (প্রকৃত লাভ-ক্ষতির অন্ধত্ব):** Provides real-time visibility into True Daily Retained Cash $(\text{Revenue} - \text{OPEX} - \text{Petty} - \text{Staff Costs})$.
4. **Generator Fuel Pilferage (জেনারেটর তেল চুরি):** Tracks fuel liters purchased against generator run-hours to detect fuel siphoning and price inflation.

---

## 2. Stakeholder Analysis Matrix

| Stakeholder | Core Pain Points | Key Needs & Expectations | Risks & Fears | Desired Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **🏋️ Gym Owner** | প্রতিদিনের নানা খরচ ও স্টাফদের অ্যাডভান্সের সঠিক ট্র্যাক না থাকা; মাস শেষে বেতনের সময় গরমিল। | **Real-time OPEX Visibility**: কোন খাতে কত খরচ হচ্ছে (ডিজেল, নাস্তা, পার্টস) এবং কার বেতনের সাথে কী অ্যাডজাস্ট হবে তা ফোনে দেখা। | স্টাফ অসন্তুষ্টি, ডিজেল বা পার্টস কেনায় অতিরিক্ত ভুয়া বিলিং। | **Automated Profit & Loss**: প্রাত্যহিক খরচ স্বয়ংক্রিয়ভাবে ব্যালেন্স শিট ও স্টাফদের পে-রোলের সাথে লিংক হওয়া। |
| **👔 Gym Manager** | স্টাফদের চা-নাস্তা বা তেলের টাকা দিতে গিয়ে নিজের পকেট থেকে খরচ হয়ে যাওয়া, পরে ওনারের কাছ থেকে টাকা তুলতে না পারা। | **১-ট্যাপ এক্সপেন্স ও রিইমবার্সমেন্ট লগার**: কোন স্টাফ কত টাকা নিল তা সাথে সাথে এন্ট্রি দেওয়া। | ওনার তাকে অবিশ্বাস করবে বা পকেটের টাকা ফেরত পাবে না। | দিনের সব খরচের স্বচ্ছ ক্যাটাগরাইজড লগ ও অনুমোদন। |
| **💪 Trainer / Staff** | জিমের জন্য দূর থেকে কেবল/ডাম্বেল কিনে আনার রিকশাভাড়া নিজের পকেট থেকে দেওয়া; বেতনের অগ্রিম টাকা মনে না রাখা। | **Personal Ledger / Advance Tracker**: নিজের দৈনিক টিফিন ভাতা এবং নেওয়া অগ্রিমের পরিষ্কার হিসাব মোবাইলে দেখা। | মাস শেষে অতিরিক্ত টাকা বেতন থেকে কেটে রাখা। | সময়মতো নির্ভুল বেতন ও খরচের টাকা রিইমবার্স পাওয়া। |
| **🧹 Cleaning Staff** | ময়লা ফেলার টাকা বা ডিটারজেন্টের টাকা পেতে দেরি হওয়া। | তাৎক্ষণিক ক্যাশ লগ ও রসিদবিহীন কুইক ভাউচার। | টাকা না পাওয়া। | নিয়মিত প্রাত্যহিক হাতখরচ ও মজুরি পাওয়া। |

---

## 3. The 4 Core Operational & Staff Expense Pillars

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        GYM OPEX & STAFF EXPENSE ENGINE                                 │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. 👥 Staff Ledger &     │ 2. 🏢 Daily Gym OPEX     │ 3. ⛽ Generator & Utility Fuel   │
│    Advance Auto-Adjust   │    Categorizer           │    Tracker                       │
│ • Salary Advance Deduct  │ • Supplies, Waste, Repair│ • Liters, Rate, Run-Hours        │
│ • Daily Tiffin Allowance │ • Fixed vs Variable Tag  │ • Load-shedding cost per hour    │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. 📊 1-Tap Daily & Monthly OPEX Analytics + WhatsApp Settlement Dossier              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: 👥 Staff Daily Ledger & Salary Advance Auto-Adjust
* **Mechanism:** When logging an expense under `STAFF_SALARY_ADVANCE` and selecting a trainer/staff member (e.g. *"Trainer Shuvo"*):
  * Instantly debits Shuvo's personal ledger by ৳1,000.
  * Automatically calculates `Net Payable Salary = Base Salary + Commissions - Unsettled Advances` in the Payroll & Financials hub.
* **Value:** 100% eliminates forgotten deductions and month-end friction.

### Pillar 2: 🏢 3-Second OPEX Quick Logger (৬টি সুনির্দিষ্ট বিজনেস হেড)
* **Categories:**
  1. **🥪 Staff Welfare & Tiffin** (টিফিন, নাস্তা, চা, স্টাফ জরুরি ওষুধ)
  2. **⛽ Power & Generator Fuel** (ডিজেল, মবিল, ইঞ্জিন অয়েল)
  3. **🧹 Hygiene & Sanitation** (ঝাড়ু, ডিটারজেন্ট, ফিনাইল, ময়লা ফেলার বিল)
  4. **🔧 Ad-hoc Hardware & Repairs** (নাট-বল্টু, তার, কেবল, ইলেকট্রিশিয়ান মজুরি)
  5. **📜 Govt / Trade / Local Fees** (ট্রেড লাইসেন্স ফটোকপি, লোকাল গার্ড চাঁদা, পৌরকর)
  6. **💼 Office & Admin Misc** (রশিদ বই প্রিন্ট, খাতা, স্ট্যাম্প, ওয়াইফাই রিচার্জ)

### Pillar 3: ⛽ Generator Fuel & Utility Efficiency Tracker
* **Mechanism:** Dedicated fields for `Liters Purchased (e.g. 15L)` and optional `Run Hours`.
* **Value:** Calculates fuel burn efficiency $(\text{Cost per Hour of Load Shedding})$ and flags excessive consumption anomalies.

### Pillar 4: 📊 Daily Net Cash Flow Snapshot
* **Dynamic Formula:**
  $$\text{Daily Net Retained Cash} = \text{Gross Collected Revenue} - (\text{Petty Cash Outflows} + \text{Staff Advances} + \text{Daily OPEX})$$
* **Value:** Instant clarity on daily profitability before turning off the lights.

---

## 4. Features vs. Benefits Matrix

| Feature | Engineering Mechanism | User Immediate Benefit | Gym Owner Business ROI |
| :--- | :--- | :--- | :--- |
| **1. Staff Salary Advance Auto-Deduct** | Target staff ID linking to payroll state. | Staff sees transparent advance slips immediately. | **Zero Advance Leakage:** Saves ৳5,000–৳15,000/month in forgotten salary deductions. |
| **2. Payment Source Separation** | Tagging `CASH_DRAWER`, `BKASH`, `OWNER_PERSONAL`. | Cash drawer balance stays 100% accurate. | **No False Shortages:** Owner knows if bills were paid from drawer or personal pocket. |
| **3. Generator Fuel Auditor** | Liters + Cost logging. | Driver/Manager brings fuel without receipt disputes. | **Fuel Pilferage Prevention:** Stops fake fuel receipts and inflated liters. |
| **4. Daily Net Cash Flow Radar** | Real-time inflow minus all outflows arithmetic. | Immediate visibility into daily gym profitability. | **Financial Discipline:** Identifies wasteful daily spending patterns instantly. |
| **5. WhatsApp Daily OPEX Dossier** | Itemized markdown digest compiler. | Manager submits complete day's audit in 1 tap. | **Complete Remote Oversight:** Owner monitors operations without being at the front desk. |

---

## 5. Technical Architecture & TypeScript Contracts

### TypeScript Schema (`types/gym.ts`)

```typescript
export type GymOPEXCategory =
  | 'STAFF_SALARY_ADVANCE'
  | 'STAFF_TIFFIN_ALLOWANCE'
  | 'STAFF_TRANSPORT_REIMBURSE'
  | 'GENERATOR_FUEL'
  | 'UTILITIES_WATER_POWER'
  | 'CLEANING_SANITATION'
  | 'HARDWARE_EQUIPMENT_REPAIR'
  | 'OFFICE_SUPPLIES_MISC'
  | 'GOVT_TRADE_FEES';

export interface GymOperationalExpenseItem {
  id: string;
  voucherNumber: string; // e.g. "EXP-20260901-01"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  category: GymOPEXCategory;
  amountBdt: number;
  paidFrom: 'CASH_DRAWER' | 'BKASH_MERCHANT' | 'OWNER_PERSONAL' | 'BANK_TRANSFER';
  spentBy: string; // Staff or Manager Name
  targetStaffId?: string; // If salary advance or personal allowance
  targetStaffName?: string;
  fuelLiters?: number; // If generator diesel
  recipientName?: string; // Vendor / Shop
  hasReceiptPhoto?: boolean;
  receiptPhotoUri?: string;
  notes?: string;
}

export interface StaffLedgerSummary {
  staffId: string;
  staffName: string;
  role: string;
  monthlyBaseSalaryBdt: number;
  totalAdvanceTakenThisMonthBdt: number;
  totalAllowancesClaimedBdt: number;
  netPayableSalaryBdt: number;
}
```

---

## 6. UI / UX Wireframes & 3-Second OPEX Logger

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 GYM OPEX & STAFF EXPENSE COMMAND                         │
├─────────────────────────────────────────────────────────────┤
│ 📈 TODAY'S NET RETAINED CASH: ৳ 11,050                      │
│    (Inflow: ৳14,500 | OPEX: ৳2,150 | Staff Adv: ৳1,300)     │
├─────────────────────────────────────────────────────────────┤
│ ⚡ QUICK EXPENSE TYPE:                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ 💸 Staff Advance     │  │ ⛽ Generator Diesel  │          │
│ │    Select Staff ➔    │  │    Liters + Rate     │          │
│ └──────────────────────┘  └──────────────────────┘          │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ 🥪 Staff Tiffin / Tea│  │ 🔧 Hardware / Repair │          │
│ │    ৳ 50 / head       │  │    Emergency Fix     │          │
│ └──────────────────────┘  └──────────────────────┘          │
│                                                             │
│ Paid From: [ (•) Cash Drawer | ( ) Owner Personal bKash ]   │
│ Amount: [ ৳ 1,000                                   ]       │
│ Staff: [ Trainer Shuvo (Salary: ৳18,000)            ▼ ]     │
│                                                             │
│ [ ⚡ LOG EXPENSE & AUTO-UPDATE LEDGER ]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Edge Cases & Intelligent Safeguards

1. **Staff Resignation with Unsettled Advance (চাকরি ছাড়ার সময় বকেয়া অগ্রিম):**
   * If a trainer resigns mid-month, system flags: *"⚠️ Trainer Shuvo has ৳2,000 unsettled advance balance. Settle before closing profile."*
2. **Paid from Owner's Personal Wallet (ওনারের পার্সোনাল বিকাশ থেকে পেমেন্ট):**
   * If `OWNER_PERSONAL` is selected, the cash is **NOT** deducted from the front-desk cash drawer, preventing false cash shortage alarms during shift closing.
3. **Group Tiffin / Shared Expenses (যৌথ নাস্তার বিল):**
   * Supports `Shared Staff Welfare` with a single entry without needing to split manual math.

---

## 8. Automated WhatsApp Daily OPEX & Staff Settlement Dossier

```text
📊 *IRONFORGE FITNESS ARENA — DAILY OPEX & STAFF EXPENSE DOSSIER* 🏢
📅 Date: 01 September 2026 | ⏰ Day Settlement
👤 Generated By: Manager Tareq | 🏢 Branch: Dhanmondi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 *TODAY'S TOTAL OPERATIONAL OUTFLOWS: ৳ 3,450*
• Paid from Cash Drawer: ৳ 1,950
• Paid from bKash / Owner: ৳ 1,500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 *STAFF ADVANCES & ALLOWANCES (৳ 1,300):*
1️⃣ [#EXP-01] *Salary Advance to Trainer Shuvo*
   • Amount: ৳ 1,000 | Paid From: Cash Drawer
   • ⚠️ Auto-tagged: Deducted from Shuvo's Sept Salary (Remaining Net: ৳17,000)

2️⃣ [#EXP-02] *Daily Staff Evening Tiffin (3 Persons)*
   • Amount: ৳ 300 | Paid From: Cash Drawer (Capped @ ৳100/head)

🏢 *GYM OPERATIONS & FUEL (৳ 2,150):*
3️⃣ [#EXP-03] *Generator Diesel (12 Liters @ ৳115/L)*
   • Category: ⛽ Power & Fuel | Amount: ৳ 1,380
   • Paid From: Cash Drawer | Recipient: Meghna Petrol Pump
   • Proof: 📷 Meter & Cash Memo attached

4️⃣ [#EXP-04] *AC Filter Servicing Technician Charge*
   • Category: 🔧 Hardware & Repair | Amount: ৳ 770
   • Paid From: bKash Merchant (Owner Approval ID #892)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 *DAILY CASH FLOW SNAPSHOT:*
• Total Revenue Inflow: ৳ 14,500
• Total Outflows (OPEX + Petty): ৳ 3,450
• 🟢 Net Daily Retained Cash: ৳ 11,050

🔒 *All entries reconciled with GymOS Payroll & Ledger.*
```

---

## 9. Feature Prioritization Matrix

| Feature & Capability | Priority | Complexity | Financial Impact | Target Milestone |
| :--- | :---: | :---: | :---: | :---: |
| **👥 Staff Salary Advance Auto-Debit & Ledger** | **P0** | Low | 🔥 Critical (Stops forgotten deductions) | Phase 1 (MVP) |
| **🏢 6-Category OPEX Quick Logger** | **P0** | Low | 🔥 High (Categorizes all outflows) | Phase 1 (MVP) |
| **💳 Payment Source Tagging (`DRAWER` vs `OWNER`)** | **P0** | Very Low | 💎 High (Prevents false cash shortages) | Phase 1 (MVP) |
| **⛽ Generator Diesel Fuel & Meter Tracker** | **P1** | Medium | 💎 High (Stops fuel theft) | Phase 1 (MVP) |
| **📊 Net Daily Cash Flow (Inflow - Outflows) Card** | **P1** | Low | ⚡ High (Instant financial visibility) | Phase 1 (MVP) |
| **📲 WhatsApp Daily OPEX Dossier Dispatcher** | **P1** | Low | 💎 High (Remote owner peace of mind) | Phase 1 (MVP) |

---

## 🏁 Sign-Off & Approvals
* **Product Manager:** Principal GymOS Architect  
* **Lead Financial Systems Engineer:** Commercial Fitness Operations Specialist  
* **Auditing Advisor:** Commercial Gym Financial Auditor  
* **Target Release:** GymOS Core v2.8
