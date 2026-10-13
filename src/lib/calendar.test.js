import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarMonth, kstDate } from './calendar.js';
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
