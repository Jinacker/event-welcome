import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarMonth, calendarWeeks, kstDate, scheduledMonths, resolveCalendarMonth } from './calendar.js';
import { selectHotFeedCards } from './hotFeedSelection.js';
import { createEventDemo } from './demo.js';
test('한국 날짜와 윤년·달을 걸치는 일정 표시', () => {
  assert.equal(kstDate(new Date('2026-10-12T15:00:00Z')), '2026-10-13');
  const days = calendarMonth('2024-02', [{ id: 'a', startDate: '2024-01-30', endDate: '2024-02-02' }]).filter(Boolean);
  assert.equal(days.length, 29); assert.equal(days[0].items.length, 1); assert.equal(days[2].items.length, 0);
});
test('핫 피드는 원본을 보존하고 TOP10에서만 랜덤4개를 반응 순서로 선택한다', () => {
  const notes = Array.from({ length: 15 }, (_, id) => ({ id, likeCount: id, viewCount: id * 2 }));
  const copy = structuredClone(notes); const result = selectHotFeedCards(notes, () => 0.5);
  assert.equal(result.length, 4); assert.ok(result.every((item) => item.id < 10));
  assert.deepEqual(result.map((item) => item.id), [...result.map((item) => item.id)].sort((a, b) => b - a)); assert.deepEqual(notes, copy);
});
test('목업은 API·인증 없이 랭킹 공동순위·실제와 구분된 일정·스탬프를 제공한다', async () => {
  const demo = createEventDemo();
  assert.deepEqual((await demo.bridge.api('/ranking')).items.map((item) => item.rank), [1, 1, 3, 4]);
  assert.equal((await demo.bridge.api('/stamps')).earned, 3); assert.equal(demo.event.calendar.length, 2);
  assert.match(demo.event.publicData.description, /목업/); await assert.rejects(demo.bridge.navigate('event_map'), /목업/);
});

test('10·11월 일정만 등록하면 두 달만 이동하고 현재 달이 없으면 첫 일정 달을 연다', () => {
  const months = scheduledMonths([
    { startDate: '2026-11-11', endDate: '2026-11-13' },
    { startDate: '2026-10-02', endDate: '2026-10-02' },
    { startDate: '2026-10-20', endDate: '2026-10-21' },
  ]);
  assert.deepEqual(months, ['2026-10', '2026-11']);
  assert.equal(resolveCalendarMonth(months, '2026-09', '2026-12'), '2026-10');
  assert.equal(resolveCalendarMonth(months, '2026-09', '2026-11'), '2026-11');
  assert.equal(resolveCalendarMonth(months, '2026-11', '2026-10'), '2026-11');
});
test('일정 없는 중간 달은 건너뛰고 연말 기간 일정은 걸치는 모든 달을 포함한다', () => {
  assert.deepEqual(scheduledMonths([
    { startDate: '2026-10-01', endDate: '2026-10-02' },
    { startDate: '2026-12-01', endDate: '2026-12-02' },
  ]), ['2026-10', '2026-12']);
  assert.deepEqual(scheduledMonths([{ startDate: '2026-12-30', endDate: '2027-02-01' }]), ['2026-12', '2027-01', '2027-02']);
});
test('일정 없음과 조회 중 일정 삭제에도 표시 월은 안전하게 결정한다', () => {
  assert.deepEqual(scheduledMonths([]), []);
  assert.equal(resolveCalendarMonth([], '2026-11', '2026-10'), '2026-10');
  assert.equal(resolveCalendarMonth(['2026-10'], '2026-11', '2026-12'), '2026-10');
});

test('날짜 아래 일정 막대를 기간만큼 배치하고 주 경계에서 이어 표시한다', () => {
  const weeks = calendarWeeks('2026-10', [{ id: 'tour', title: '투어', startDate: '2026-10-11', endDate: '2026-10-20' }]);
  const segments = weeks.flatMap((week) => week.segments);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments.map(({ start, end, continuesBefore, continuesAfter }) => [start, end, continuesBefore, continuesAfter]), [[0, 6, false, true], [0, 2, true, false]]);
});
test('겹치는 일정은 줄을 나누고 겹치지 않는 일정은 같은 줄을 쓴다', () => {
  const weeks = calendarWeeks('2026-10', [
    { id: 'a', startDate: '2026-10-11', endDate: '2026-10-15' },
    { id: 'b', startDate: '2026-10-13', endDate: '2026-10-14' },
    { id: 'c', startDate: '2026-10-16', endDate: '2026-10-17' },
  ]);
  const segments = weeks.flatMap((week) => week.segments);
  assert.deepEqual(segments.map(({ item, lane }) => [item.id, lane]), [['a', 0], ['b', 1], ['c', 0]]);
});
test('이전 달에서 이어지는 일정은 현재 달 날짜만 차지한다', () => {
  const [first] = calendarWeeks('2026-10', [{ id: 'a', startDate: '2026-09-30', endDate: '2026-10-02' }]);
  assert.deepEqual(first.segments.map(({ start, end, continuesBefore }) => [start, end, continuesBefore]), [[4, 5, true]]);
  assert.equal(first.days.length, 7);
});
