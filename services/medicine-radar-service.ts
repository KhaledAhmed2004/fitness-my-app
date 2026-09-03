import { MedicineItem } from '@/types/medicine';

export type ExpiryStatusTier = 'EXPIRED' | 'CRITICAL_7D' | 'WARNING_30D' | 'SAFE' | 'UNKNOWN';

export interface MedicineRadarAnalysis {
  medicine: MedicineItem;
  dailyDoseRate: number;
  daysOfSupplyRemaining: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  expiryStatus: ExpiryStatusTier;
  daysUntilExpiry: number | null;
  expiryLabelBn: string;
  expiryBadgeColor: string;
  refillMessageBn: string;
  expiryMessageBn: string;
  actionRequired: 'NONE' | 'REFILL_SOON' | 'DISCARD_EXPIRED' | 'REPLACE_SOON';
}

/**
 * Calculate how many units/pills are taken per day based on schedules
 */
export function getDailyDoseRate(medicine: MedicineItem): number {
  if (medicine.isAsNeeded || !medicine.schedules || medicine.schedules.length === 0) {
    return 1; // Default fallback to 1 unit/day if PRN
  }
  const total = medicine.schedules.reduce(
    (acc, sch) => acc + (sch.doseAmount || 1),
    0
  );
  return total > 0 ? total : 1;
}

/**
 * Calculate days of supply remaining for a medicine
 */
export function getDaysOfSupply(medicine: MedicineItem): number | null {
  if (!medicine.trackInventory) return null;
  const dailyRate = getDailyDoseRate(medicine);
  if (medicine.currentStock <= 0) return 0;
  return Math.floor(medicine.currentStock / dailyRate);
}

/**
 * Calculate expiry status and remaining days
 */
export function getExpiryDetails(medicine: MedicineItem): {
  status: ExpiryStatusTier;
  daysUntilExpiry: number | null;
  labelBn: string;
  color: string;
} {
  if (!medicine.expiryDate) {
    return {
      status: 'UNKNOWN',
      daysUntilExpiry: null,
      labelBn: 'মেয়াদ তারিখ যুক্ত করা হয়নি',
      color: '#8899A6',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(medicine.expiryDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'EXPIRED',
      daysUntilExpiry: diffDays,
      labelBn: `🚨 মেয়াদোত্তীর্ণ (${Math.abs(diffDays)} দিন আগে শেষ)`,
      color: '#EF4444',
    };
  } else if (diffDays <= 7) {
    return {
      status: 'CRITICAL_7D',
      daysUntilExpiry: diffDays,
      labelBn: `🔴 মেয়াদ শেষ হতে আর ${diffDays} দিন বাকি`,
      color: '#EF4444',
    };
  } else if (diffDays <= 30) {
    return {
      status: 'WARNING_30D',
      daysUntilExpiry: diffDays,
      labelBn: `🟡 মেয়াদ শেষ হতে আর ${diffDays} দিন বাকি`,
      color: '#F59E0B',
    };
  } else {
    return {
      status: 'SAFE',
      daysUntilExpiry: diffDays,
      labelBn: `🟢 মেয়াদ নিরাপদ (${medicine.expiryDate})`,
      color: '#10B981',
    };
  }
}

/**
 * Perform comprehensive radar analysis on a single medicine
 */
export function analyzeMedicineRadar(medicine: MedicineItem): MedicineRadarAnalysis {
  const dailyDoseRate = getDailyDoseRate(medicine);
  const daysOfSupply = getDaysOfSupply(medicine);
  const isOutOfStock = medicine.trackInventory && medicine.currentStock <= 0;
  const isLowStock =
    medicine.trackInventory &&
    medicine.currentStock <= (medicine.lowStockThreshold || 5);

  const expiry = getExpiryDetails(medicine);

  let refillMessageBn = '';
  if (isOutOfStock) {
    refillMessageBn = `আপনার ${medicine.name} এর স্টক সম্পূর্ণ শেষ! অবিলম্বে নতুন পাতা সংগ্রহ করুন।`;
  } else if (isLowStock && daysOfSupply !== null) {
    refillMessageBn = `আপনার ${medicine.name} আর ${daysOfSupply} দিনের আছে (${medicine.currentStock}টি ${medicine.unit} বাকি), নতুন পাতা কিনুন।`;
  } else if (daysOfSupply !== null) {
    refillMessageBn = `বর্তমান স্টকে আর প্রায় ${daysOfSupply} দিন চলবে (${medicine.currentStock}টি ${medicine.unit})।`;
  }

  let expiryMessageBn = '';
  if (expiry.status === 'EXPIRED') {
    expiryMessageBn = `⚠️ সাবধান! ${medicine.name} এর মেয়াদ শেষ হয়ে গেছে। মেয়াদোত্তীর্ণ ওষুধ সেবন বিষাক্ত হতে পারে, ড্রয়ার থেকে দ্রুত ফেলে দিন।`;
  } else if (expiry.status === 'CRITICAL_7D') {
    expiryMessageBn = `জরুরি সতর্কতা: ${medicine.name} এর মেয়াদ আর মাত্র ${expiry.daysUntilExpiry} দিন পর শেষ হবে। নতুন স্টক সংগ্রহ করুন।`;
  } else if (expiry.status === 'WARNING_30D') {
    expiryMessageBn = `${medicine.name} এর মেয়াদ শেষ হতে আর ${expiry.daysUntilExpiry} দিন বাকি। ড্রয়ারের স্টক চেক করুন।`;
  }

  let actionRequired: 'NONE' | 'REFILL_SOON' | 'DISCARD_EXPIRED' | 'REPLACE_SOON' = 'NONE';
  if (expiry.status === 'EXPIRED') {
    actionRequired = 'DISCARD_EXPIRED';
  } else if (isOutOfStock || isLowStock) {
    actionRequired = 'REFILL_SOON';
  } else if (expiry.status === 'CRITICAL_7D' || expiry.status === 'WARNING_30D') {
    actionRequired = 'REPLACE_SOON';
  }

  return {
    medicine,
    dailyDoseRate,
    daysOfSupplyRemaining: daysOfSupply,
    isLowStock,
    isOutOfStock,
    expiryStatus: expiry.status,
    daysUntilExpiry: expiry.daysUntilExpiry,
    expiryLabelBn: expiry.labelBn,
    expiryBadgeColor: expiry.color,
    refillMessageBn,
    expiryMessageBn,
    actionRequired,
  };
}

/**
 * Scan entire medicine cabinet and produce aggregate radar report
 */
export function scanCabinetRadar(medicines: MedicineItem[]): {
  expiredItems: MedicineRadarAnalysis[];
  expiringSoonItems: MedicineRadarAnalysis[];
  lowStockItems: MedicineRadarAnalysis[];
  safeItems: MedicineRadarAnalysis[];
  totalAlertsCount: number;
} {
  const activeMeds = medicines.filter((m) => !m.isArchived);

  const expiredItems: MedicineRadarAnalysis[] = [];
  const expiringSoonItems: MedicineRadarAnalysis[] = [];
  const lowStockItems: MedicineRadarAnalysis[] = [];
  const safeItems: MedicineRadarAnalysis[] = [];

  activeMeds.forEach((m) => {
    const analysis = analyzeMedicineRadar(m);
    if (analysis.expiryStatus === 'EXPIRED') {
      expiredItems.push(analysis);
    } else if (
      analysis.expiryStatus === 'CRITICAL_7D' ||
      analysis.expiryStatus === 'WARNING_30D'
    ) {
      expiringSoonItems.push(analysis);
    }

    if (analysis.isLowStock || analysis.isOutOfStock) {
      lowStockItems.push(analysis);
    }

    if (
      analysis.expiryStatus === 'SAFE' &&
      !analysis.isLowStock &&
      !analysis.isOutOfStock
    ) {
      safeItems.push(analysis);
    }
  });

  const totalAlertsCount =
    expiredItems.length + expiringSoonItems.length + lowStockItems.length;

  return {
    expiredItems,
    expiringSoonItems,
    lowStockItems,
    safeItems,
    totalAlertsCount,
  };
}

/**
 * Format an automated Pharmacy Shopping List for WhatsApp / SMS / Clipboard
 */
export function generatePharmacyShoppingList(
  lowStockItems: MedicineRadarAnalysis[],
  patientName = 'Patient'
): string {
  if (lowStockItems.length === 0) {
    return 'সব ওষুধের স্টক পর্যাপ্ত রয়েছে। কোনো ওষুধ কেনার প্রয়োজন নেই।';
  }

  const itemsList = lowStockItems
    .map((item, idx) => {
      const med = item.medicine;
      const daysLeft = item.daysOfSupplyRemaining ?? 0;
      const suggestQty = Math.max(10, Math.ceil(item.dailyDoseRate * 30)); // 1 month supply suggestion
      return `${idx + 1}. ${med.name} (${med.strength || ''} ${med.formFactor})\n   • বর্তমান বাকি: ${med.currentStock}টি (${daysLeft} দিন চলবে)\n   • প্রস্তাবিত ক্রয়: ১ মাসের সাপ্লাই (~${suggestQty}টি / পাতা)`;
    })
    .join('\n\n');

  return `🛒 ফার্মেসি মেডিসিন অর্ডার লিস্ট (Pharmacy Buying List)
============================================================
রোগীর নাম: ${patientName}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

রিফিল প্রয়োজন এমন ওষুধসমূহ (${lowStockItems.length}টি):
------------------------------------------------------------
${itemsList}

💡 নির্দেশিকা:
দয়া করে উল্লিখিত ব্র্যান্ড বা সমমানের স্বীকৃত কোম্পানির অরিজিনাল ওষুধ সরবরাহ করুন।
============================================================
TrackMe Smart Pharmacy Radar`;
}
