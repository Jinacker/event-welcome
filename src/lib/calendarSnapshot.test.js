import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarMonths, trimCalendarMonth } from './calendarSnapshot.js';

const week = (days) => `<div class="calendar-week"><div class="calendar-week-dates">${days.map((day) => `<div class="calendar-day "><span>${day}</span></div>`).join('')}</div><div class="calendar-week-events"></div></div>`;

const month = (label, weeks, nav = '다음 달') => `<div class="calendar-card"><div class="calendar-heading"><strong>${label}</strong>`
  + `<button type="button" aria-label="${nav}"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg></button></div>`
  + `<div class="calendar-weeks">${weeks.map(week).join('')}</div></div>`;

const october = month('2026년 10월', [[1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]]);
const november = month('2026년 11월', [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14], [15, 16, 17, 18, 19, 20, 21]], '이전 달');
const period = { startDate: '2026-10-20', endDate: '2026-11-08' };
const days = (html) => html.split('<div class="calendar-week">').slice(1)
  .map((part) => [...part.split('<div class="calendar-week-events">')[0].matchAll(/<span>(\d{1,2})<\/span>/g)].map((matched) => Number(matched[1])));

test('행사 기간에 걸치는 주만 남긴다', () => {
  assert.deepEqual(days(trimCalendarMonth(october, '2026년 10월', period)), [[18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]]);
  assert.deepEqual(days(trimCalendarMonth(november, '2026년 11월', period)), [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14]]);
});

test('남은 주와 카드 마크업이 깨지지 않는다', () => {
  const trimmed = trimCalendarMonth(october, '2026년 10월', period);
  assert.equal(trimmed.startsWith('<div class="calendar-card">'), true);
  assert.equal(trimmed.endsWith('</div></div></div></div>'), true);
  assert.equal((trimmed.match(/<div/g) || []).length, (trimmed.match(/<\/div>/g) || []).length);
  assert.equal(trimmed.includes('2026년 10월'), true);
});

test('월 이동 버튼은 남기지 않는다', () => {
  assert.equal(/aria-label="(이전|다음) 달"/.test(trimCalendarMonth(october, '2026년 10월', period)), false);
  assert.equal(/aria-label="(이전|다음) 달"/.test(trimCalendarMonth(october, '2026년 10월', null)), false);
});

test('기간을 모르면 모든 주를 그대로 보여준다', () => {
  assert.equal(days(trimCalendarMonth(october, '2026년 10월', null)).length, 5);
  assert.equal(days(trimCalendarMonth(october, '알 수 없는 달', period)).length, 5);
});

test('기간과 겹치지 않는 달은 빼고 순서는 그대로 둔다', () => {
  const months = calendarMonths({ '2026년 10월': october, '2026년 11월': november, '2026년 12월': month('2026년 12월', [[1, 2, 3, 4, 5]]) }, period);
  assert.deepEqual(months.map((item) => item.label), ['2026년 10월', '2026년 11월']);
  for (const value of [undefined, null, 'not-object']) assert.deepEqual(calendarMonths(value, period), []);
  assert.equal(trimCalendarMonth('', '2026년 10월', period), '');
});
