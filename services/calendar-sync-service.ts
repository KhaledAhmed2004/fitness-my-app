import { Linking, Platform } from 'react-native';
import {
  CalendarAlarmConfig,
  CalendarPlatform,
  SyncableHealthEvent,
} from '@/types/calendar-sync';

// Default Alarm Configuration (24h, 2h, 30m)
export const DEFAULT_ALARM_CONFIG: CalendarAlarmConfig = {
  remind24HoursBefore: true,
  remind2HoursBefore: true,
  remind30MinutesBefore: true,
  includeFastingInstructions: true,
  includeDoctorContact: true,
};

function formatIsoForCalendar(dateStr: string, timeStr?: string): { start: string; end: string } {
  // e.g. "2026-09-15" and "10:00 AM" or "10:00"
  try {
    const d = new Date(dateStr);
    let hours = 10;
    let minutes = 0;

    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const meridian = match[3]?.toUpperCase();
        if (meridian === 'PM' && hours < 12) hours += 12;
        if (meridian === 'AM' && hours === 12) hours = 0;
      }
    }

    d.setHours(hours, minutes, 0, 0);
    const end = new Date(d.getTime() + 60 * 60 * 1000); // 1 hour duration

    const pad = (n: number) => String(n).padStart(2, '0');
    const toCalString = (dateObj: Date) =>
      `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(
        dateObj.getHours()
      )}${pad(dateObj.getMinutes())}${pad(dateObj.getSeconds())}`;

    return {
      start: toCalString(d),
      end: toCalString(end),
    };
  } catch {
    const cleanDate = dateStr.replace(/-/g, '');
    return {
      start: `${cleanDate}T100000`,
      end: `${cleanDate}T110000`,
    };
  }
}

/**
 * 1. Build Google Calendar Web Intent URL
 */
export function buildGoogleCalendarUrl(event: SyncableHealthEvent): string {
  const { start, end } = formatIsoForCalendar(event.startDate, event.startTime);
  const title = encodeURIComponent(`🩺 ${event.title} (${event.memberName})`);
  const location = encodeURIComponent(event.location || 'Healthcare Provider / Chamber');

  let detailsText = `👤 Patient: ${event.memberName}\n🏥 Location: ${event.location || 'Chamber'}`;
  if (event.doctorName) detailsText += `\n👨‍⚕️ Doctor: ${event.doctorName} (${event.specialty || 'General'})`;
  if (event.clinicalNotes) detailsText += `\n\n📋 Clinical Instructions & Fasting:\n${event.clinicalNotes}`;
  detailsText += `\n\n⏰ Alarms: 24h before, 2h before, 30m before\n(TrackMe Family Health Calendar Sync)`;

  const details = encodeURIComponent(detailsText);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * 2. Build RFC 5545 Standard iCalendar (.ics) String for Apple Calendar / Outlook / System Calendar
 */
export function generateIcsCalendarString(events: SyncableHealthEvent[]): string {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vEvents = events.map((event) => {
    const { start, end } = formatIsoForCalendar(event.startDate, event.startTime);
    let desc = `Patient: ${event.memberName}\\nLocation: ${event.location || 'Chamber'}`;
    if (event.doctorName) desc += `\\nDoctor: ${event.doctorName}`;
    if (event.clinicalNotes) desc += `\\nNotes: ${event.clinicalNotes}`;
    desc += `\\n(Synced via TrackMe Family Health OS)`;

    return `BEGIN:VEVENT
UID:trackme_${event.id}_${event.startDate}
DTSTAMP:${nowStr}
DTSTART:${start}
DTEND:${end}
SUMMARY:🩺 ${event.title} - ${event.memberName}
DESCRIPTION:${desc}
LOCATION:${event.location || 'Chamber'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: 24 hours before ${event.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Reminder: 2 hours before ${event.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: 30 minutes before ${event.title}
END:VALARM
END:VEVENT`;
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TrackMe//Family Health OS//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:TrackMe Health Agenda
${vEvents.join('\n')}
END:VCALENDAR`;
}

/**
 * 3. 1-Tap Launch in Google Calendar
 */
export async function syncSingleEventToGoogleCalendar(event: SyncableHealthEvent): Promise<boolean> {
  const url = buildGoogleCalendarUrl(event);
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      await Linking.openURL(url);
      return true;
    }
  } catch (err) {
    console.warn('Failed to open Google Calendar URL:', err);
    return false;
  }
}

/**
 * 4. 1-Tap Launch in Apple Calendar / iCal
 */
export async function syncSingleEventToAppleCalendar(event: SyncableHealthEvent): Promise<boolean> {
  const icsData = generateIcsCalendarString([event]);
  const encodedUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsData)}`;

  try {
    if (Platform.OS === 'ios') {
      // iOS calshow or data uri
      await Linking.openURL(encodedUri);
      return true;
    }
    // Universal fallback: Open in browser/calendar handler
    await Linking.openURL(encodedUri);
    return true;
  } catch (err) {
    // If data uri fails, fallback to Google Calendar web intent
    console.warn('Apple iCal direct launch fallback to Google intent:', err);
    return await syncSingleEventToGoogleCalendar(event);
  }
}

/**
 * 5. Extract Unified Syncable Health Items from Health Vault State
 */
export function extractSyncableHealthEventsFromVault(
  followUps: any[],
  vaccinations: any[],
  diagnosticTests: any[],
  members: any[],
  selectedMemberId: string = 'ALL'
): SyncableHealthEvent[] {
  const items: SyncableHealthEvent[] = [];

  const getMemberName = (id: string) => {
    const m = members.find((mem: any) => mem.id === id);
    return m ? m.name : 'Family Member';
  };

  // 1. Follow-up Doctor Appointments
  for (const f of followUps) {
    if (f.status === 'UPCOMING' || f.status === 'DUE') {
      if (selectedMemberId === 'ALL' || f.memberId === selectedMemberId) {
        items.push({
          id: f.id,
          memberId: f.memberId,
          memberName: getMemberName(f.memberId),
          title: `Doctor Follow-up: ${f.doctorName || 'Specialist Consultation'}`,
          itemType: 'DOCTOR_FOLLOWUP',
          startDate: f.dueDate,
          startTime: '10:30 AM',
          durationMinutes: 45,
          location: 'Doctor Chamber / Hospital',
          clinicalNotes: f.reason ? `Reason: ${f.reason}\n${f.notes || ''}` : 'Routine clinical review',
          doctorName: f.doctorName,
          alarmPresets: [1440, 120, 30],
          isSynced: false,
        });
      }
    }
  }

  // 2. Upcoming Booster Vaccines
  for (const v of vaccinations) {
    if (v.nextDueDate) {
      if (selectedMemberId === 'ALL' || v.memberId === selectedMemberId) {
        items.push({
          id: v.id,
          memberId: v.memberId,
          memberName: getMemberName(v.memberId),
          title: `Booster Vaccine: ${v.vaccineName} (Dose ${(v.doseNumber || 1) + 1})`,
          itemType: 'VACCINE_BOOSTER',
          startDate: v.nextDueDate,
          startTime: '11:00 AM',
          durationMinutes: 30,
          location: v.providerName || 'Vaccination Center / Hospital',
          clinicalNotes: `Scheduled booster dose for ${v.vaccineName}. Bring vaccine card and record.`,
          alarmPresets: [1440, 120, 30],
          isSynced: false,
        });
      }
    }
  }

  // 3. Pending Diagnostic Tests
  for (const t of diagnosticTests) {
    if (t.status === 'PENDING') {
      if (selectedMemberId === 'ALL' || t.memberId === selectedMemberId) {
        const isFastingRequired =
          t.testName.toLowerCase().includes('glucose') ||
          t.testName.toLowerCase().includes('sugar') ||
          t.testName.toLowerCase().includes('lipid') ||
          t.testName.toLowerCase().includes('fasting');

        items.push({
          id: t.id,
          memberId: t.memberId,
          memberName: getMemberName(t.memberId),
          title: `Lab Test: ${t.testName}`,
          itemType: 'LAB_DIAGNOSTIC_TEST',
          startDate: t.testDate || new Date().toISOString().split('T')[0],
          startTime: '08:30 AM',
          durationMinutes: 45,
          location: t.labOrHospital || 'Diagnostic Center',
          clinicalNotes: isFastingRequired
            ? '⚠️ 8-10 Hours Strict Fasting Required before sample collection. Drink plain water only.'
            : 'Routine sample collection. Bring previous lab prescriptions.',
          alarmPresets: [1440, 120, 30],
          isSynced: false,
        });
      }
    }
  }

  // Sort by startDate ascending
  return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
