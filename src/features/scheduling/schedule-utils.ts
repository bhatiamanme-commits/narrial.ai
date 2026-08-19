export type Meridiem = 'AM' | 'PM';

export function getDefaultSchedule(now = new Date()): { date: Date; hour: string; minute: string; meridiem: Meridiem } {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
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

export function buildScheduledDate(date: Date | null, hour: string, minute: string, meridiem: Meridiem): Date | null {
  if (!date || !/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) return null;
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (hourNumber < 1 || hourNumber > 12 || minuteNumber < 0 || minuteNumber > 59) return null;
  const hours = hourNumber % 12 + (meridiem === 'PM' ? 12 : 0);
  const value = new Date(date);
  value.setHours(hours, minuteNumber, 0, 0);
  return value;
}

export function validateSchedule(date: Date | null, hour: string, minute: string, meridiem: Meridiem, now = new Date()): string {
  if (!date) return 'Choose a post date.';
  if (!/^\d{1,2}$/.test(hour) || Number(hour) < 1 || Number(hour) > 12) return 'Enter an hour from 1 to 12.';
  if (!/^\d{1,2}$/.test(minute) || Number(minute) < 0 || Number(minute) > 59) return 'Enter minutes from 00 to 59.';
  const scheduledAt = buildScheduledDate(date, hour, minute, meridiem);
  if (!scheduledAt || scheduledAt.getTime() <= now.getTime()) return 'Choose a time in the future.';
  return '';
}

export function formatScheduleSummary(value: Date | null, timezoneLabel: string): string {
  if (!value) return 'Choose a future date and time';
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(value);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(value);
  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(value);
  const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', hour12: true }).format(value);
  return `Scheduled for ${weekday}, ${day} ${month} at ${time} · ${timezoneLabel}`;
}

export function getLocalTimezone(): { id: string; label: string } {
  const id = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const name = id.replaceAll('_', ' ').replaceAll('/', ' / ');
  const parts = new Intl.DateTimeFormat('en', { timeZone: id, timeZoneName: 'longOffset' }).formatToParts(new Date());
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value.replace('GMT', 'GMT') ?? 'GMT';
  return { id, label: `${name} (${offset})` };
}
