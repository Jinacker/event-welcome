import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventRefresh, pullRefreshDistance, singleFlight, PULL_REFRESH_THRESHOLD } from './refresh.js';
const start = { clientX: 10, clientY: 20 };
const touch = (x, y) => ({ clientX: x, clientY: y });

test('상단에서 한 손가락으로 아래로 당길 때만 새로고침 거리와 기준을 넘는다', () => {
  assert.ok(pullRefreshDistance(start, touch(10, 150)) >= PULL_REFRESH_THRESHOLD);
  assert.equal(pullRefreshDistance(start, touch(10, 500)), 90);
  assert.equal(pullRefreshDistance(start, touch(10, 150), 1), 0);
  assert.equal(pullRefreshDistance(start, touch(10, 150), 0, 2), 0);
  assert.equal(pullRefreshDistance(start, touch(200, 30)), 0);
  assert.equal(pullRefreshDistance(start, touch(10, 0)), 0);
  assert.ok(pullRefreshDistance(start, touch(10, 40)) < PULL_REFRESH_THRESHOLD);
});
test('진행 중 요청은 하나로 합치고 실패 후 다시 실행할 수 있다', async () => {
  let calls = 0; let reject;
  const run = singleFlight(() => { calls++; return new Promise((_, fail) => { reject = fail; }); });
  const first = run(); const second = run(); assert.equal(first, second);
  await Promise.resolve(); assert.equal(calls, 1);
  reject(new Error('network')); await assert.rejects(first, /network/);
  const third = run(); await Promise.resolve(); assert.equal(calls, 2);
  reject(new Error('network')); await assert.rejects(third, /network/);
});
test('등록된 모든 영역이 끝날 때까지 기다리고 중복 실행과 종료한 영역 호출을 막는다', async () => {
  const refresh = createEventRefresh(); let calls = 0; let finish;
  const remove = refresh.register(() => { calls++; return new Promise((resolve) => { finish = resolve; }); });
  const first = refresh.run(); const second = refresh.run(); assert.equal(first, second);
  await new Promise((resolve) => setImmediate(resolve)); assert.equal(calls, 1);
  finish(); await first; remove(); await refresh.run(); assert.equal(calls, 1);
});
test('일부 영역 실패에도 다른 영역 완료를 기다리고 재시도할 수 있다', async () => {
  const refresh = createEventRefresh(); let finish; let settled = false;
  const removeFailing = refresh.register(() => { throw new Error('failed'); });
  refresh.register(() => new Promise((resolve) => { finish = resolve; }));
  const first = refresh.run(); first.catch(() => { settled = true; });
  await new Promise((resolve) => setImmediate(resolve)); assert.equal(settled, false);
  finish(); await assert.rejects(first, /일부 정보를/); removeFailing();
  const retry = refresh.run(); await new Promise((resolve) => setImmediate(resolve)); finish(); await retry;
});
