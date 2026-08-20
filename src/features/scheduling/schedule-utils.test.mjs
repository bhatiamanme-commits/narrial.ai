import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCalendarDays, buildZonedScheduledDate, formatScheduleSummary, getDefaultSchedule, getTimezoneLabel, validateSchedule } from './schedule-utils.ts';

test('buildCalendarDays creates an aligned calendar grid for August 2026', () => {
  const days = buildCalendarDays(2026, 7);
  assert.equal(days.length, 42);
  assert.equal(days[0], null);
  assert.equal(days[6], 1);
  assert.equal(days[36], 31);
});

test('buildZonedScheduledDate converts wall time in the selected IANA timezone to an instant', () => {
  const newYork = buildZonedScheduledDate(new Date(2026, 7, 21), '10', '30', 'PM', 'America/New_York');
  const kolkata = buildZonedScheduledDate(new Date(2026, 7, 21), '10', '30', 'PM', 'Asia/Kolkata');
  assert.equal(newYork?.toISOString(), '2026-08-22T02:30:00.000Z');
  assert.equal(kolkata?.toISOString(), '2026-08-21T17:00:00.000Z');
});

test('validateSchedule distinguishes invalid and past times', () => {
  const now = new Date('2026-08-21T20:00:00.000Z');
  assert.equal(validateSchedule(null, '10', '30', 'PM', 'UTC', now), 'Choose a post date.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '13', '30', 'PM', 'UTC', now), 'Enter an hour from 1 to 12.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '7', '30', 'PM', 'UTC', now), 'Choose a time in the future.');
  assert.equal(validateSchedule(new Date(2026, 7, 21), '10', '30', 'PM', 'UTC', now), '');
});

test('formatScheduleSummary derives the local time and seasonal offset from the instant', () => {
  const summer = new Date('2026-08-22T02:30:00.000Z');
  const winter = new Date('2026-12-22T03:30:00.000Z');
  assert.equal(formatScheduleSummary(summer, 'America/New_York', 'Eastern Time'), 'Scheduled for Fri, 21 Aug at 10:30 PM · Eastern Time (GMT-04:00)');
  assert.equal(getTimezoneLabel('America/New_York', 'Eastern Time', winter), 'Eastern Time (GMT-05:00)');
});

test('getDefaultSchedule provides a valid future time so scheduling is immediately available', () => {
  const now = new Date(2026, 7, 21, 23, 45);
  const value = getDefaultSchedule(now);
  assert.equal(value.date.getDate(), 22);
  assert.equal(value.hour, '10');
  assert.equal(value.minute, '30');
  assert.equal(value.meridiem, 'PM');
  assert.equal(validateSchedule(value.date, value.hour, value.minute, value.meridiem, 'UTC', now), '');
});
