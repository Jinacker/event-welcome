import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTACT_MAX_LENGTH, contactError, createContactSender } from './contact.js';

test('앱 세션 브리지에 내용만 전달하고 앞뒤 공백을 정리한다', async () => {
  const calls = [];
  const send = createContactSender({ isNative: true, api: async (...args) => { calls.push(args); return { id: 7 }; } });
  assert.deepEqual(await send('  스탬프 문의\n입니다.  '), { id: 7 });
  assert.deepEqual(calls, [['/messages', { method: 'POST', data: { content: '스탬프 문의\n입니다.' } }]]);
});

test('빈 값·null·초과 입력과 브라우저·미리보기는 전송하지 않는다', async () => {
  let calls = 0;
  const api = async () => { calls += 1; };
  const send = createContactSender({ isNative: true, api });
  for (const value of [undefined, null, 1, '', ' \n ', '가'.repeat(CONTACT_MAX_LENGTH + 1)]) await assert.rejects(send(value));
  for (const bridge of [{ isNative: false, api }, { isNative: true, isPreview: true, api }]) await assert.rejects(createContactSender(bridge)('문의'));
  assert.equal(calls, 0);
  await send('😀'.repeat(CONTACT_MAX_LENGTH));
  assert.equal(calls, 1);
});

test('응답 전 연속 클릭은 한 번만 전송하고 실패 시 자동 재시도하지 않는다', async () => {
  let calls = 0; let reject;
  const send = createContactSender({ isNative: true, api: () => { calls += 1; return new Promise((_, fail) => { reject = fail; }); } });
  const first = send('문의');
  const second = send('문의');
  assert.equal(first, second);
  await Promise.resolve();
  reject(new Error('timeout'));
  await assert.rejects(first, /timeout/);
  assert.equal(calls, 1);
  const retry = send('수정한 문의');
  await Promise.resolve(); reject(new Error('network'));
  await assert.rejects(retry);
  assert.equal(calls, 2);
});

test('실패는 성공으로 처리하지 않으며 불명확한 결과는 내 문의 확인을 안내한다', () => {
  for (const code of ['400', '401', '404', '410', '503']) assert.ok(contactError({ code }).length > 0);
  for (const error of [undefined, new Error('timeout'), { code: '500' }]) assert.match(contactError(error), /내 문의.*먼저 확인/);
});
