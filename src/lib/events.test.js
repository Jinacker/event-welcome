import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_HOME_LINK, appEventLink, inactiveRedirect, loadBrowserEvent, resolveEventId } from './events.js';
test('NFC 링크의 검증 파라미터는 앱 진입에 보존하고 이벤트 ID·native는 제외한다', () => {
  assert.equal(appEventLink(1, '?source=nfc&code=abc&eventId=2&native=1'), 'katsumap://event/1?source=nfc&code=abc');
});
test('NFC 링크·직접 경로는 같은 이벤트 ID를 선택한다', () => {
  assert.equal(resolveEventId('/event/2', ''), 2); assert.equal(resolveEventId('/seongbukcheon', '?eventId=2'), 2);
  const events = [{ id: 1, enabled: false, webPath: '/seongbukcheon' }, { id: 2, enabled: true, webPath: '/seongbukcheon' }];
  assert.equal(resolveEventId('/seongbukcheon', '', events), 2);
  assert.equal(resolveEventId('/event/0', ''), null); assert.equal(resolveEventId('/event/2147483648', ''), null);
});
test('비활성은 정확히 2초 후 이벤트가 아닌 앱 홈으로 가며 타이머를 정리한다', () => {
  let callback; let ms; let canceled; let opens = 0;
  const cleanup = inactiveRedirect({ openHome: () => opens++, schedule: (fn, delay) => { callback = fn; ms = delay; return 42; }, cancel: (id) => canceled = id });
  assert.equal(ms, 2000); assert.equal(opens, 0); callback(); assert.equal(opens, 1); cleanup(); assert.equal(canceled, 42); assert.equal(APP_HOME_LINK, 'katsumap://');
});
test('서버 실패를 비활성 이벤트로 오해하지 않는다', async () => {
  await assert.rejects(loadBrowserEvent({ pathname: '/event/1', search: '' }, 'https://api.test', async () => ({ ok: false, status: 503 })), (error) => error.code === '503');
});
test('브라우저 직접 진입은 공개 API로 실제 활성 상태를 확인한다', async () => {
  let called;
  const event = await loadBrowserEvent({ pathname: '/event/1', search: '' }, 'https://api.test', async (url, opts) => {
    called = url; assert.equal(opts.cache, 'no-store'); assert.equal(opts.headers.Authorization, undefined);
    return { ok: true, json: async () => ({ data: { id: 1, enabled: false } }) };
  });
  assert.equal(called, 'https://api.test/api/v1/events/1'); assert.equal(event.enabled, false);
});
