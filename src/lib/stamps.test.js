import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampSlots } from './stamps.js';
test('17칸 중 실제 받은 수만 순서대로 채운다', () => {
  assert.deepEqual(stampSlots(17, 3), [...Array(3).fill(true), ...Array(14).fill(false)]);
  assert.equal(stampSlots(17, 0).filter(Boolean).length, 0);
});
test('다른 투어 가게 수와 가게 제외 후 보존된 스탬프를 표시한다', () => {
  assert.equal(stampSlots(7, 2).length, 7); assert.deepEqual(stampSlots(2, 3), [true, true, true]);
  assert.deepEqual(stampSlots(null, -1), []);
});
