export type Meridiem = 'AM' | 'PM';
export type TimezoneOption = { id: string; name: string };

export function getDefaultSchedule(timeZone: string, now = new Date()): { date: Date; hour: string; minute: string; meridiem: Meridiem } {
  const selectedDate = getDateTimeParts(now, timeZone);
  const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day + 1);
  return { date, hour: '10', minute: '30', meridiem: 'PM' };
}

export function buildCalendarDays(year: number, month: number): (number | null)[] {
  const leading = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day > 0 && day <= count ? day : null;
  });
}

type DateTimeParts = { year: number; month: number; day: number; hour: number; minute: number };

function getDateTimeParts(value: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day'), hour: read('hour'), minute: read('minute') };
}

export function buildZonedScheduledDate(date: Date | null, hour: string, minute: string, meridiem: Meridiem, timeZone: string): Date | null {
  if (!date || !/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) return null;
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (hourNumber < 1 || hourNumber > 12 || minuteNumber < 0 || minuteNumber > 59) return null;
  const target: DateTimeParts = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: hourNumber % 12 + (meridiem === 'PM' ? 12 : 0),
    minute: minuteNumber,
  };

  try {
    const wallClockAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    let instant = wallClockAsUtc;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const displayed = getDateTimeParts(new Date(instant), timeZone);
      const displayedAsUtc = Date.UTC(displayed.year, displayed.month - 1, displayed.day, displayed.hour, displayed.minute);
      instant -= displayedAsUtc - wallClockAsUtc;
    }
    const result = new Date(instant);
    const resolved = getDateTimeParts(result, timeZone);
    return Object.keys(target).every((key) => resolved[key as keyof DateTimeParts] === target[key as keyof DateTimeParts]) ? result : null;
  } catch {
    return null;
  }
}

export function validateSchedule(date: Date | null, hour: string, minute: string, meridiem: Meridiem, timeZone: string, now = new Date()): string {
  if (!date) return 'Choose a post date.';
  if (!/^\d{1,2}$/.test(hour) || Number(hour) < 1 || Number(hour) > 12) return 'Enter an hour from 1 to 12.';
  if (!/^\d{1,2}$/.test(minute) || Number(minute) < 0 || Number(minute) > 59) return 'Enter minutes from 00 to 59.';
  const scheduledAt = buildZonedScheduledDate(date, hour, minute, meridiem, timeZone);
  if (!scheduledAt) return 'That local time does not exist in the selected time zone.';
  if (scheduledAt.getTime() <= now.getTime()) return 'Choose a time in the future.';
  return '';
}

export function getTimezoneLabel(timeZone: string, name: string, instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(instant);
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  return `${name} (${offset})`;
}

export function formatScheduleSummary(value: Date | null, timeZone: string, timezoneName: string): string {
  if (!value) return 'Choose a future date and time';
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone }).format(value);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(value);
  const month = new Intl.DateTimeFormat('en', { month: 'short', timeZone }).format(value);
  const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).format(value);
  return `Scheduled for ${weekday}, ${day} ${month} at ${time} · ${getTimezoneLabel(timeZone, timezoneName, value)}`;
}

export function getLocalTimezone(): TimezoneOption {
  const id = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return { id, name: id.replaceAll('_', ' ').replaceAll('/', ' / ') };
}
