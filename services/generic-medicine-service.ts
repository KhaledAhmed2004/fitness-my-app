import {
  AlternativeComparisonResult,
  GenericMoleculeGroup,
  MedicineBrandItem,
  TherapeuticCategory,
} from '@/types/generic-medicine';
import { GENERIC_MEDICINE_CATALOG } from './generic-medicine-catalog';

export class GenericMedicineService {
  private static catalog: GenericMoleculeGroup[] = GENERIC_MEDICINE_CATALOG;

  /**
   * Search brands and molecules across the catalog
   */
  public static search(
    query: string,
    categoryFilter: TherapeuticCategory = 'ALL'
  ): {
    molecules: GenericMoleculeGroup[];
    brands: MedicineBrandItem[];
  } {
    const q = query.trim().toLowerCase();

    // 1. Filter molecules by category
    let filteredMolecules = this.catalog;
    if (categoryFilter !== 'ALL') {
      filteredMolecules = this.catalog.filter(
        (m) => m.therapeuticClass === categoryFilter
      );
    }

    if (!q) {
      const allBrands = filteredMolecules.flatMap((m) => m.brands);
      return {
        molecules: filteredMolecules,
        brands: allBrands,
      };
    }

    // 2. Search matches
    const matchedMolecules: GenericMoleculeGroup[] = [];
    const matchedBrands: MedicineBrandItem[] = [];

    for (const mol of filteredMolecules) {
      const molNameMatch =
        mol.genericName.toLowerCase().includes(q) ||
        mol.bengaliGenericName.toLowerCase().includes(q) ||
        mol.classLabelBn.toLowerCase().includes(q);

      const matchingBrandsInMol = mol.brands.filter(
        (b) =>
          b.brandName.toLowerCase().includes(q) ||
          b.shortCompany.toLowerCase().includes(q) ||
          b.manufacturer.toLowerCase().includes(q) ||
          b.genericName.toLowerCase().includes(q) ||
          b.indicationsBn.toLowerCase().includes(q)
      );

      if (molNameMatch || matchingBrandsInMol.length > 0) {
        matchedMolecules.push(mol);
      }

      for (const brand of matchingBrandsInMol) {
        if (!matchedBrands.some((b) => b.id === brand.id)) {
          matchedBrands.push(brand);
        }
      }
    }

    return {
      molecules: matchedMolecules,
      brands: matchedBrands,
    };
  }

  /**
   * Find all equivalent alternatives for a given brand name or ID
   */
  public static getAlternativesForBrand(
    brandIdOrName: string,
    targetStrength?: string
  ): AlternativeComparisonResult | null {
    const cleanQuery = brandIdOrName.trim().toLowerCase();

    let targetBrand: MedicineBrandItem | undefined;
    let targetMolecule: GenericMoleculeGroup | undefined;

    // 1. Locate brand and molecule
    for (const mol of this.catalog) {
      const found = mol.brands.find(
        (b) =>
          b.id === brandIdOrName ||
          b.brandName.toLowerCase() === cleanQuery ||
          cleanQuery.startsWith(b.brandName.toLowerCase())
      );
      if (found) {
        targetBrand = found;
        targetMolecule = mol;
        break;
      }
    }

    // Fallback: If query was generic name instead of brand
    if (!targetMolecule) {
      targetMolecule = this.catalog.find(
        (m) =>
          m.id === brandIdOrName ||
          m.genericName.toLowerCase() === cleanQuery ||
          m.bengaliGenericName.toLowerCase().includes(cleanQuery)
      );
      if (targetMolecule) {
        targetBrand = targetMolecule.brands[0];
      }
    }

    if (!targetMolecule) return null;

    const strength = targetStrength || targetBrand?.strength || targetMolecule.standardStrengths[0];

    // Filter alternatives that match exact generic ID and strength
    const matchingAlternatives = targetMolecule.brands.filter(
      (b) => b.strength === strength
    );

    // Sort: Cheapest first, then top tier
    const sorted = [...matchingAlternatives].sort(
      (a, b) => a.unitPriceBdt - b.unitPriceBdt
    );

    const cheapest = sorted[0] || targetBrand;
    const highest = sorted[sorted.length - 1] || targetBrand;

    const priceSavingsPercentage =
      highest && cheapest && highest.unitPriceBdt > cheapest.unitPriceBdt
        ? Math.round(
            ((highest.unitPriceBdt - cheapest.unitPriceBdt) /
              highest.unitPriceBdt) *
              100
          )
        : 0;

    return {
      searchedBrand: targetBrand,
      molecule: targetMolecule,
      matchingStrength: strength,
      alternatives: sorted,
      cheapestAlternative: cheapest,
      priceSavingsPercentage,
    };
  }

  /**
   * Get all generic molecules by category
   */
  public static getMoleculesByCategory(
    category: TherapeuticCategory
  ): GenericMoleculeGroup[] {
    if (category === 'ALL') return this.catalog;
    return this.catalog.filter((m) => m.therapeuticClass === category);
  }

  /**
   * Get molecule group by ID
   */
  public static getMoleculeById(id: string): GenericMoleculeGroup | undefined {
    return this.catalog.find((m) => m.id === id);
  }
}
