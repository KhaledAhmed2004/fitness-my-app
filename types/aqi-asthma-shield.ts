export type AqiCategory =
  | 'GOOD_0_50'
  | 'MODERATE_51_100'
  | 'UNHEALTHY_SENSITIVE_101_150'
  | 'UNHEALTHY_151_200'
  | 'VERY_UNHEALTHY_201_300'
  | 'HAZARDOUS_301_PLUS';

export interface CityAqiInfo {
  cityId: string;
  cityNameBn: string;
  cityNameEn: string;
  currentAqi: number;
  pm25Concentration: number; // in ug/m3
  category: AqiCategory;
  categoryLabelBn: string;
  categoryColor: string;
  advisoryBn: string;
  maskRequired: boolean;
  outdoorSafe: boolean;
}

export type InhalerType = 'RELIEVER_SOS' | 'CONTROLLER_PREVENTER' | 'COMBINATION_MAINTENANCE';

export interface InhalerItem {
  id: string;
  brandName: string;
  genericName: string;
  type: InhalerType;
  colorTag: string;
  totalPuffsCapacity: number; // usually 200
  remainingPuffs: number;
  lowPuffAlertThreshold: number; // e.g. 20
  lastPuffTimestamp?: string;
}

export type PuffTriggerReason =
  | 'ROUTINE_MORNING'
  | 'ROUTINE_NIGHT'
  | 'ACUTE_BREATHLESSNESS'
  | 'POLLUTION_SMOG'
  | 'EXERCISE_INDUCED'
  | 'DUST_COLD_TRIGGER';

export interface InhalerPuffLog {
  id: string;
  inhalerId: string;
  inhalerName: string;
  type: InhalerType;
  puffsCount: number;
  timestamp: string; // HH:mm
  triggerReason: PuffTriggerReason;
}

export type PeakFlowZone = 'GREEN_SAFE' | 'YELLOW_CAUTION' | 'RED_DANGER';

export interface PeakFlowMeasurement {
  measuredLpm: number;
  personalBestLpm: number;
  percentOfPersonalBest: number;
  zone: PeakFlowZone;
  zoneLabelBn: string;
  zoneColor: string;
  clinicalActionBn: string;
}

export interface AsthmaControlSummary {
  selectedCity: CityAqiInfo;
  todayRelieverPuffs: number;
  todayPreventerPuffs: number;
  isRelieverOverused: boolean; // >4 puffs/day
  peakFlowStatus?: PeakFlowMeasurement;
  asthmaControlStatusBn: string;
  emergencyAlert: boolean;
}
