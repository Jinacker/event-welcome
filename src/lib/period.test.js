import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarPeriod, dateRangeLabel, longPeriodLabel, monthDayLabel, periodLabel } from './period.js';

test('기간은 같은 해·달을 생략해 표기한다', () => {
  assert.equal(periodLabel('2026-10-20', '2026-11-08'), '2026.10.20–11.08');
  assert.equal(periodLabel('2026-10-20', '2026-10-24'), '2026.10.20–24');
  assert.equal(periodLabel('2026-12-30', '2027-01-02'), '2026.12.30–2027.01.02');
  assert.equal(periodLabel('2026-10-20', '2026-10-20'), '2026.10.20');
});

test('일정 전체를 감싸는 기간을 구하고 잘못된 날짜는 무시한다', () => {
  const calendar = [
    { id: 'popup', startDate: '2026-10-25', endDate: '2026-10-25' },
    { id: 'show', startDate: '2026-10-20', endDate: '2026-11-08' },
    { id: 'broken', startDate: '2026/10/01', endDate: '' },
  ];
  assert.deepEqual(calendarPeriod(calendar), { startDate: '2026-10-20', endDate: '2026-11-08', label: '2026.10.20–11.08' });
  for (const value of [undefined, null, [], [{ id: 'x' }], 'not-array']) assert.equal(calendarPeriod(value), null);
});

test('팝업 날짜는 월·일만 보여준다', () => {
  assert.equal(monthDayLabel('2026-10-05'), '10월 5일');
  assert.equal(dateRangeLabel('2026-10-23', '2026-10-24'), '10월 23일 – 10월 24일');
  assert.equal(dateRangeLabel('2026-10-25', '2026-10-25'), '10월 25일');
  assert.equal(dateRangeLabel('2026-10-25', ''), '');
});

test('안내 문구용 긴 기간 표기를 만든다', () => {
  assert.equal(longPeriodLabel('2026-10-20', '2026-11-08'), '2026년 10월 20일–11월 8일');
  assert.equal(longPeriodLabel('2026-10-20', '2026-10-20'), '2026년 10월 20일');
  assert.equal(longPeriodLabel('', '2026-11-08'), '');
});
