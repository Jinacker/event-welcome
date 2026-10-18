import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBridge } from './client.js';
const host = () => {
  const listeners = new Map(); const messages = [];
  return { messages, __KATSU_EVENT__: { nonce: 'page' }, ReactNativeWebView: { postMessage: (value) => messages.push(JSON.parse(value)) },
    addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type) => listeners.delete(type),
    respond: (value) => listeners.get('katsu-event-response')?.({ detail: value }),
  };
};
test('요청 ID·nonce로 응답을 매칭하며 이전 페이지 응답을 무시한다', async () => {
  const win = host(); const bridge = createEventBridge(win); const result = bridge.getContext(); await Promise.resolve();
  const sent = win.messages[0]; assert.equal(sent.method, 'context.get'); assert.equal(sent.channel, 'katsu-event');
  win.respond({ id: sent.id, nonce: 'old', ok: true, result: 'wrong' });
  win.respond({ id: sent.id, nonce: 'page', ok: true, result: { user: { id: 1 } } });
  assert.deepEqual(await result, { user: { id: 1 } }); bridge.dispose();
});
test('앱 오류의 상태 코드를 보존하고 알 수 없는 기능은 전송하지 않는다', async () => {
  const win = host(); const bridge = createEventBridge(win); const pending = bridge.api('/context'); await Promise.resolve();
  const sent = win.messages[0]; win.respond({ id: sent.id, nonce: 'page', ok: false, error: { code: '410', message: '비활성' } });
  await assert.rejects(pending, (error) => error.code === '410'); await assert.rejects(bridge.request('eval', {})); assert.equal(win.messages.length, 1); bridge.dispose();
});
test('페이지 종료는 남은 요청을 취소하고 리스너를 해제한다', async () => {
  const win = host(); const bridge = createEventBridge(win); const pending = bridge.pickImage(); await Promise.resolve(); bridge.dispose();
  await assert.rejects(pending, /닫혔습니다/); await assert.rejects(bridge.getContext());
});
test('앱 초기화를 기다리는 중 종료해도 준비 타이머를 취소한다', async () => {
  const win = host(); delete win.__KATSU_EVENT__;
  const bridge = createEventBridge(win); const pending = bridge.getContext(); bridge.dispose();
  await assert.rejects(pending, /닫혔습니다/); assert.equal(win.messages.length, 0);
});
test('구매 링크는 기존 share 요청으로 보내고 앱의 성공·실패 응답을 전달한다', async () => {
  const win = host(); const bridge = createEventBridge(win);
  const url = 'https://smartstore.naver.com/katsumap/products/123';
  try {
    const opened = bridge.share(url); await Promise.resolve();
    const sent = win.messages[0];
    assert.equal(sent.method, 'share'); assert.deepEqual(sent.payload, { message: url });
    win.respond({ id: sent.id, nonce: 'page', ok: true, result: null });
    assert.equal(await opened, null);
    const failed = bridge.share(url); await Promise.resolve();
    const next = win.messages[1];
    win.respond({ id: next.id, nonce: 'page', ok: false, error: { code: 'FAILED', message: '열기 실패' } });
    await assert.rejects(failed, /열기 실패/);
  } finally { bridge.dispose(); }
});
