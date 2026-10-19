import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampBoard, stampGoal, stampImage, stampSlots } from './stamps.js';
test('17칸 중 실제 받은 수만 순서대로 채운다', () => {
  assert.deepEqual(stampSlots(17, 3), [...Array(3).fill(true), ...Array(14).fill(false)]);
  assert.equal(stampSlots(17, 0).filter(Boolean).length, 0);
});
test('다른 투어 가게 수와 가게 제외 후 보존된 스탬프를 표시한다', () => {
  assert.equal(stampSlots(7, 2).length, 7); assert.deepEqual(stampSlots(2, 3), [true, true, true]);
  assert.deepEqual(stampSlots(null, -1), []);
});

test('완주 목표는 추가 웹 설정을 우선하고 없으면 참여 가게 수를 쓴다', () => {
  const tour = { restaurants: [{ id: 1 }, { id: 2 }, { id: 3 }] };
  assert.equal(stampGoal({ stampTour: tour, publicData: { stampGoal: 10 } }), 10);
  assert.equal(stampGoal({ stampTour: tour, publicData: {} }), 3);
  for (const stampGoalValue of [0, -1, 4.5, 401, null, 'ten']) {
    assert.equal(stampGoal({ stampTour: tour, publicData: { stampGoal: stampGoalValue } }), 3);
  }
  assert.equal(stampGoal(undefined), 0);
});

test('스탬프판은 목표 칸마다 획득 여부와 보상 문구를 담는다', () => {
  const board = stampBoard(4, 2, { 2: '추첨권 1장', 4: '추첨권 2장 추가', 9: '범위 밖' });
  assert.deepEqual(board, [
    { index: 0, filled: true, label: '' }, { index: 1, filled: true, label: '추첨권 1장' },
    { index: 2, filled: false, label: '' }, { index: 3, filled: false, label: '추첨권 2장 추가' },
  ]);
  assert.deepEqual(stampBoard(0, 0), []);
  assert.deepEqual(stampBoard(2, 0, null), [{ index: 0, filled: false, label: '' }, { index: 1, filled: false, label: '' }]);
});

test('도장 그림은 업로드 주소와 미리보기 경로만 쓰고 그 외에는 글자 도장으로 돌아간다', () => {
  const url = 'https://storage.googleapis.com/katsu-map-images/launch-banners/events/1760000000000_a-b.png';
  assert.equal(stampImage({ stampTour: { stampImageUrl: ` ${url} ` } }), url);
  assert.equal(stampImage({ stampTour: { stampImageUrl: url.replace('.png', '.gif') } }), url.replace('.png', '.gif'));
  assert.equal(stampImage({ stampTour: { stampImageUrl: '/demo-stamp.svg' } }), '/demo-stamp.svg');
  for (const bad of [undefined, null, '', '   ', 1, 'https://evil.test/stamp.png', 'http://storage.googleapis.com/katsu-map-images/launch-banners/events/a.png',
    url.replace('.png', '.jpg'), url.replace('events/', 'events/sub/'), 'javascript:alert(1)', '//evil.test/a.png', 'demo-stamp.svg']) {
    assert.equal(stampImage({ stampTour: { stampImageUrl: bad } }), '');
  }
  assert.equal(stampImage(undefined), '');
  assert.equal(stampImage({}), '');
});
