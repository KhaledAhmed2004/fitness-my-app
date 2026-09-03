export type DuplicateType =
  | 'LAB_TEST'
  | 'DOCUMENT_SCAN'
  | 'MEDICINE'
  | 'EXPENSE';

export interface DuplicateRecordItem {
  id: string;
  type: DuplicateType;
  title: string;
  date: string;
  providerOrLab?: string;
  costOrValue?: string | number;
  tags?: string[];
  documentUri?: string;
  notes?: string;
  rawObject: any;
}

export interface DuplicateCandidate {
  id: string;
  memberId: string;
  memberName: string;
  type: DuplicateType;
  primaryStandardName: string;
  recordA: DuplicateRecordItem;
  recordB: DuplicateRecordItem;
  matchScore: number; // e.g. 96 (%)
  matchReason: string;
  detectedAt: string;
  status: 'PENDING' | 'MERGED' | 'DISMISSED';
}

export interface StandardizedMedicalTerm {
  canonicalCode: string;
  standardName: string;
  category: 'LAB_TEST' | 'MEDICINE' | 'VACCINE';
  aliases: string[];
  description?: string;
}

export interface CleanupAuditEntry {
  id: string;
  timestamp: string;
  memberId: string;
  action: 'MERGE' | 'STANDARDIZE' | 'DISMISS';
  summary: string;
  retainedRecordId: string;
  mergedRecordId?: string;
  mergedDetails: string;
}

export interface DataQualityReport {
  overallScore: number; // 0-100%
  totalRecords: number;
  duplicatesFound: number;
  standardizedCount: number;
  cleanRecordsCount: number;
  lastScannedAt: string;
}
