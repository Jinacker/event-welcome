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
  await assert.rejects(loadBrowserEvent({ pathname: '/event/1', search: '' }, async () => ({ ok: false, status: 503 })), (error) => error.code === '503');
});
test('브라우저 직접 진입은 같은 웹 주소의 공개 설정만 조회한다', async () => {
  let called;
  const event = await loadBrowserEvent({ pathname: '/event/1', search: '' }, async (url, opts) => {
    called = url; assert.equal(opts.cache, 'no-store'); assert.equal(opts.headers.Authorization, undefined);
    return { ok: true, json: async () => ({ events: [{ id: 1, enabled: false, webPath: '/seongbukcheon' }] }) };
  });
  assert.match(called, /^\/event-config\.json\?v=\d+$/); assert.equal(event.enabled, false);
});


test('루트는 활성 이벤트를 우선하고 비활성만 있으면 최신 이벤트를 표시한다', () => {
  const events = [{ id: 1, enabled: false, webPath: '/old' }, { id: 2, enabled: true, webPath: '/seongbukcheon' }];
  assert.equal(resolveEventId('/', '', events), 2);
  assert.equal(resolveEventId('/', '?eventId=1', events), 1);
  assert.equal(resolveEventId('/', '?eventId=invalid', events), null);
  const inactive = events.map(event => ({ ...event, enabled: false }));
  assert.equal(resolveEventId('/', '', inactive), 2);
  assert.deepEqual(inactive.map(event => event.id), [1, 2]);
  assert.deepEqual(events.map(event => event.id), [1, 2]);
});
test('루트와 등록한 웹 경로는 API 없이 공개 설정에서 같은 이벤트를 선택한다', async () => {
  const value = { events: [{ id: 2, enabled: true, webPath: '/seongbukcheon' }] };
  for (const pathname of ['/', '/seongbukcheon', '/event/2']) {
    let count = 0;
    const event = await loadBrowserEvent({ pathname, search: '' }, async () => { count++; return { ok: true, json: async () => value }; });
    assert.equal(event.id, 2); assert.equal(count, 1);
  }
});
test('알 수 없는 ID·빈 설정·잘못된 설정은 비활성으로 확정하지 않는다', async () => {
  for (const config of [{ events: [] }, {}, { events: [{ id: 1, webPath: '/seongbukcheon', enabled: 'false' }] }]) {
    await assert.rejects(loadBrowserEvent({ pathname: '/event/1', search: '' }, async () => ({ ok: true, json: async () => config })));
  }
});
test('네트워크 장애는 Failed to fetch 대신 재시도 안내를 반환한다', async () => {
  await assert.rejects(loadBrowserEvent({ pathname: '/', search: '' }, async () => { throw new TypeError('Failed to fetch'); }), /이벤트 설정을 불러오지 못했어요/);
});
