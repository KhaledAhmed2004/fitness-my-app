import {
  DIAGNOSTIC_CENTERS,
  LAB_TEST_DATABASE,
} from '@/services/lab-cost-knowledge';
import {
  BasketComparisonResult,
  CenterTotalEstimate,
  DiagnosticCenterId,
  DiagnosticCenterInfo,
  LabTestCategory,
  LabTestPriceItem,
} from '@/types/lab-cost-comparator';

export function searchLabTests(
  query: string,
  category: LabTestCategory = 'ALL'
): LabTestPriceItem[] {
  const clean = query.trim().toLowerCase();

  return LAB_TEST_DATABASE.filter((test) => {
    // 1. Category Filter
    if (category !== 'ALL' && test.category !== category) {
      return false;
    }

    // 2. Search Query Filter
    if (!clean) return true;

    const matchesName =
      test.nameEn.toLowerCase().includes(clean) ||
      test.nameBn.toLowerCase().includes(clean) ||
      test.code.toLowerCase().includes(clean) ||
      test.shortDescriptionBn.toLowerCase().includes(clean);

    return matchesName;
  });
}

export function calculateBasketComparison(
  selectedTestIds: string[]
): BasketComparisonResult | null {
  if (selectedTestIds.length === 0) return null;

  const selectedTests = LAB_TEST_DATABASE.filter((t) =>
    selectedTestIds.includes(t.id)
  );

  if (selectedTests.length === 0) return null;

  // Calculate sum for each diagnostic center
  const centerTotals: CenterTotalEstimate[] = DIAGNOSTIC_CENTERS.map((center) => {
    const totalCost = selectedTests.reduce((sum, test) => {
      const price = test.prices[center.id] || test.averagePrice;
      return sum + price;
    }, 0);

    return {
      center,
      totalCost,
      savingsVsHighest: 0,
      isCheapest: false,
      isHighest: false,
    };
  });

  // Sort from lowest total cost to highest
  centerTotals.sort((a, b) => a.totalCost - b.totalCost);

  const cheapest = centerTotals[0];
  const highest = centerTotals[centerTotals.length - 1];
  const maxSavings = highest.totalCost - cheapest.totalCost;

  // Calculate savings vs highest for all centers
  centerTotals.forEach((c, idx) => {
    c.savingsVsHighest = highest.totalCost - c.totalCost;
    c.isCheapest = idx === 0;
    c.isHighest = idx === centerTotals.length - 1;
  });

  const averageTotal = Math.round(
    centerTotals.reduce((sum, c) => sum + c.totalCost, 0) / centerTotals.length
  );

  return {
    selectedTests,
    centerTotals,
    cheapestCenter: cheapest.center,
    highestCenter: highest.center,
    maxSavingsAmount: maxSavings,
    averageTotal,
  };
}

export function formatBasketShareText(result: BasketComparisonResult): string {
  const testLines = result.selectedTests
    .map((t, idx) => `${idx + 1}. ${t.nameBn} (${t.code}) - গড় মূল্য: ৳ ${t.averagePrice}`)
    .join('\n');

  const rankLines = result.centerTotals
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.center.nameBn}: ৳ ${c.totalCost.toLocaleString('bn-BD')}${c.isCheapest ? ' 🏆 [সবচেয়ে সাশ্রয়ী]' : ''}${c.savingsVsHighest > 0 ? ` (সাশ্রয়: ৳ ${c.savingsVsHighest.toLocaleString('bn-BD')})` : ''}`
    )
    .join('\n');

  return `🧪 ল্যাব টেস্ট খরচ ও ডায়াগনস্টিক সেন্টারের তুলনামূলক এস্টিমেট
============================================================
নির্বাচিত টেস্টসমূহ (${result.selectedTests.length}টি):
${testLines}

ডায়াগনস্টিক সেন্টারের মোট খরচের তালিকা:
------------------------------------------------------------
${rankLines}

💡 ফলাফল সারাংশ:
• সবচেয়ে সাশ্রয়ী সেন্টার: ${result.cheapestCenter.nameBn} (মোট ৳ ${result.centerTotals[0].totalCost})
• সর্বোচ্চ সম্ভাব্য সাশ্রয়: ৳ ${result.maxSavingsAmount.toLocaleString('bn-BD')}!
============================================================
TrackMe Diagnostic Cost Comparator • হেলথ ভল্ট`;
}
