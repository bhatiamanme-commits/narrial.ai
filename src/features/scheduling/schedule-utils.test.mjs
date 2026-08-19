import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCalendarDays, buildScheduledDate, formatScheduleSummary, getDefaultSchedule, validateSchedule } from './schedule-utils.ts';

test('buildCalendarDays creates an aligned calendar grid for August 2026', () => {
  const days = buildCalendarDays(2026, 7);
  assert.equal(days.length, 42);
  assert.equal(days[0], null);
  assert.equal(days[6], 1);
  assert.equal(days[36], 31);
});

test('buildScheduledDate converts a 12-hour time into a date', () => {
  const morning = buildScheduledDate(new Date(2026, 7, 21), '12', '05', 'AM');
  const evening = buildScheduledDate(new Date(2026, 7, 21), '10', '30', 'PM');
  assert.equal(morning?.getHours(), 0);
  assert.equal(evening?.getHours(), 22);
  assert.equal(evening?.getMinutes(), 30);
});

test('validateSchedule distinguishes invalid and past times', () => {
  const now = new Date(2026, 7, 21, 20, 0);
  assert.equal(validateSchedule(null, '10', '30', 'PM', now), 'Choose a post date.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '13', '30', 'PM', now), 'Enter an hour from 1 to 12.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '7', '30', 'PM', now), 'Choose a time in the future.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '10', '30', 'PM', now), '');
});

test('formatScheduleSummary stays synchronized with the chosen date and time', () => {
  const value = new Date(2026, 7, 21, 22, 30);
  assert.equal(formatScheduleSummary(value, 'India Standard Time'), 'Scheduled for Fri, 21 Aug at 10:30 PM · India Standard Time');
});

test('getDefaultSchedule provides a valid future time so scheduling is immediately available', () => {
  const now = new Date(2026, 7, 21, 23, 45);
  const value = getDefaultSchedule(now);
  assert.equal(value.date.getDate(), 22);
  assert.equal(value.hour, '10');
  assert.equal(value.minute, '30');
  assert.equal(value.meridiem, 'PM');
  assert.equal(validateSchedule(value.date, value.hour, value.minute, value.meridiem, now), '');
});
