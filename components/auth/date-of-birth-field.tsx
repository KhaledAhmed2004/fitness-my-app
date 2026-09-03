import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  label: string;
  value: string;
  onChange: (yyyyMmDd: string) => void;
  error?: string;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function displayLabel(value: string) {
  const date = parseDateOnly(value);
  if (!date) return 'Select date of birth';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function yearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/**
 * MENTOR: Native date picker — stores YYYY-MM-DD for Zod/API, shows friendly label in UI.
 */
export function DateOfBirthField({ label, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseDateOnly(value) ?? yearsAgo(18));

  const minimumDate = useMemo(() => yearsAgo(120), []);
  const maximumDate = useMemo(() => new Date(), []);

  const openPicker = () => {
    setDraft(parseDateOnly(value) ?? yearsAgo(18));
    setOpen(true);
  };

  const commit = (date: Date) => {
    onChange(formatDateOnly(date));
  };

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    setDraft(selected);
    commit(selected);
  };

  const onIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    setDraft(selected);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select date of birth"
        onPress={openPicker}
        style={[styles.field, error ? styles.fieldError : null]}>
        <Text style={[styles.value, !value && styles.placeholder]}>{displayLabel(value)}</Text>
        <Text style={styles.chevron}>Change</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.sheetAction}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Date of birth</Text>
              <Pressable
                onPress={() => {
                  commit(draft);
                  setOpen(false);
                }}
                hitSlop={8}>
                <Text style={styles.sheetActionDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              themeVariant="dark"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={onIosChange}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      ) : null}

      {/* Web / other: fall back to same Android-style when open */}
      {open && Platform.OS !== 'android' && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    marginBottom: 6,
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: C.error,
  },
  value: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sans,
    flex: 1,
  },
  placeholder: {
    color: C.outline,
  },
  chevron: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    marginLeft: 8,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: C.surfaceLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  sheetAction: {
    color: C.onSurfaceVariant,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
  },
  sheetActionDone: {
    color: C.primary,
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  iosPicker: {
    alignSelf: 'center',
  },
});
