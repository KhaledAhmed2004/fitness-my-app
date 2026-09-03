import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { LabResultEntry } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface LabTrendChartProps {
  analyteName: string;
  unit: string;
  readings: LabResultEntry[];
  referenceRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  referenceSource?: string;
}

export function LabTrendChart({
  analyteName,
  unit,
  readings,
  referenceRange,
  referenceSource,
}: LabTrendChartProps) {
  // Sort chronologically
  const sorted = useMemo(() => {
    return [...readings].sort((a, b) => a.testDate.localeCompare(b.testDate));
  }, [readings]);

  const [selectedIdx, setSelectedIdx] = useState<number>(
    sorted.length > 0 ? sorted.length - 1 : 0
  );

  const selectedReading = sorted[selectedIdx] || sorted[sorted.length - 1];

  // Calculate bounds for normalized bar / graph rendering
  const { minVal, maxVal } = useMemo(() => {
    if (sorted.length === 0) return { minVal: 0, maxVal: 10 };
    const vals = sorted
      .map((r) => r.numericValue)
      .filter((v): v is number => typeof v === 'number');

    if (referenceRange?.min) vals.push(referenceRange.min);
    if (referenceRange?.max) vals.push(referenceRange.max);

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const padding = (max - min) * 0.2 || 1;
    return {
      minVal: Math.max(0, min - padding),
      maxVal: max + padding,
    };
  }, [sorted, referenceRange]);

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="show-chart" size={32} color={C.onSurfaceVariant} />
        <Text style={styles.emptyText}>No recorded readings for {analyteName}</Text>
      </View>
    );
  }

  // Calculate delta from first or previous reading
  const previousReading = selectedIdx > 0 ? sorted[selectedIdx - 1] : null;
  const delta =
    selectedReading?.numericValue !== undefined &&
    previousReading?.numericValue !== undefined
      ? selectedReading.numericValue - previousReading.numericValue
      : null;

  return (
    <View style={styles.container}>
      {/* Chart Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.analyteTitle}>{analyteName}</Text>
          <Text style={styles.readingsCount}>
            {sorted.length} {sorted.length === 1 ? 'Reading' : 'Readings'} over time
          </Text>
        </View>

        {selectedReading?.numericValue !== undefined ? (
          <View style={styles.valueBox}>
            <View style={styles.valueRow}>
              <Text style={styles.currentValue}>{selectedReading.numericValue}</Text>
              <Text style={styles.unitText}>{unit}</Text>
            </View>

            {delta !== null && (
              <View style={styles.deltaRow}>
                <MaterialIcons
                  name={delta < 0 ? 'arrow-downward' : delta > 0 ? 'arrow-upward' : 'remove'}
                  size={12}
                  color={C.onSurfaceVariant}
                />
                <Text style={styles.deltaText}>
                  {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} vs prev
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* REFERENCE RANGE BANNER */}
      {referenceRange?.text || (referenceRange?.min !== undefined && referenceRange?.max !== undefined) ? (
        <View style={styles.refRangeBox}>
          <MaterialIcons name="info-outline" size={12} color="#38BDF8" />
          <Text style={styles.refRangeText}>
            Reference Range:{' '}
            {referenceRange.text ||
              `${referenceRange.min} – ${referenceRange.max} ${unit}`}
            {referenceSource ? ` • Source: ${referenceSource}` : ''}
          </Text>
        </View>
      ) : null}

      {/* TIME-SERIES VISUALIZER BARS */}
      <View style={styles.chartArea}>
        {sorted.map((item, index) => {
          const val = item.numericValue ?? 0;
          const heightPercent = Math.max(
            15,
            Math.min(100, ((val - minVal) / (maxVal - minVal)) * 100)
          );
          const isSelected = index === selectedIdx;

          return (
            <TouchableOpacity
              key={item.id || index}
              activeOpacity={0.8}
              onPress={() => setSelectedIdx(index)}
              style={styles.barCol}>
              {/* Value Label */}
              <Text
                style={[
                  styles.barValueText,
                  isSelected && styles.barValueTextSelected,
                ]}>
                {val}
              </Text>

              {/* Bar Track & Fill */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                    isSelected && styles.barFillSelected,
                  ]}
                />
              </View>

              {/* Date Label */}
              <Text
                style={[
                  styles.barDateText,
                  isSelected && styles.barDateTextSelected,
                ]}
                numberOfLines={1}>
                {item.testDate.split('-').slice(1).join('/')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SELECTED READING DETAILS FOOTER */}
      {selectedReading ? (
        <View style={styles.footerDetailCard}>
          <View style={styles.footerDetailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TEST DATE</Text>
              <Text style={styles.detailValue}>{selectedReading.testDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>LAB / HOSPITAL</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {selectedReading.referenceSource || 'Diagnostic Lab'}
              </Text>
            </View>
          </View>

          {selectedReading.notes ? (
            <Text style={styles.notesText}>
              Note: {selectedReading.notes}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* CLINICAL SAFETY DISCLAIMER */}
      <Text style={styles.disclaimerText}>
        ⓘ Reference ranges are recorded from lab reports for longitudinal tracking. Always consult your doctor for clinical interpretation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181F23',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyteTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  readingsCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  valueBox: {
    alignItems: 'flex-end',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentValue: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#38BDF8',
  },
  unitText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  deltaText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  refRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  refRangeText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
    flex: 1,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValueText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  barValueTextSelected: {
    color: '#38BDF8',
    fontSize: 11,
  },
  barTrack: {
    width: 24,
    flex: 1,
    backgroundColor: '#13191C',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#26333A',
    borderRadius: 6,
  },
  barFillSelected: {
    backgroundColor: '#38BDF8',
  },
  barDateText: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  barDateTextSelected: {
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  footerDetailCard: {
    backgroundColor: '#13191C',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  footerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
  },
  disclaimerText: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    lineHeight: 12,
    opacity: 0.8,
  },
  emptyContainer: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
});
