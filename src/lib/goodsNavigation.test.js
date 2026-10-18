import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goodsStoreHref, isGoodsStoreRequest, loadGoodsStoreDestination } from './goodsNavigation.js';

const store = 'https://smartstore.naver.com/katsumap/products/123?from=event#goods';
const item = { id: 'keyring', name: '키링', linkUrl: store };
const event = { id: 1, enabled: true, webPath: '/seongbukcheon', giftshop: { items: [item] } };
const location = (search = '?eventId=1&openStore=1&goodsId=keyring') => ({ protocol: 'https:', hostname: 'event-welcome.vercel.app', pathname: '/', search });
const response = (events = [event]) => async () => ({ ok: true, json: async () => ({ events }) });

test('브라우저는 원래 https URL, 앱은 공개 ID만 포함한 기기 브라우저 진입 주소를 사용한다', () => {
  assert.equal(goodsStoreHref(event, item), store);
  const href = goodsStoreHref({ ...event, sessionToken: 'private', userId: 9 }, { ...item, user: 'private' }, true);
  const url = new URL(href);
  assert.equal(url.origin, 'http://event-welcome.vercel.app');
  assert.equal(url.pathname, '/');
  assert.deepEqual([...url.searchParams], [['eventId', '1'], ['openStore', '1'], ['goodsId', 'keyring']]);
  assert.ok(!href.includes('private'));
  assert.ok(!href.includes('smartstore'));
  assert.equal(goodsStoreHref(event, { key: item.id, linkUrl: store }, true), href);
});

test('잘못된 URL·누락된 ID는 클릭 가능한 앱 링크로 만들지 않는다', () => {
  for (const linkUrl of ['', null, 'javascript:alert(1)', 'http://store.example/', 'https://user:pw@store.example/']) {
    assert.equal(goodsStoreHref(event, { ...item, linkUrl }, true), '');
  }
  for (const id of [undefined, null, 0, -1, '1', 2147483648]) assert.equal(goodsStoreHref({ ...event, id }, item, true), '');
  for (const id of [undefined, '', '../other', 'with space', 'x'.repeat(81)]) assert.equal(goodsStoreHref(event, { ...item, id }, true), '');
  assert.ok(goodsStoreHref({ id: 2147483647 }, { id: 'x'.repeat(80), linkUrl: store }, true));
});

test('외부 브라우저는 공개 설정을 읽고 해당 이벤트·굿즈에 등록된 https URL만 연다', async () => {
  const calls = [];
  const fetcher = async (...args) => { calls.push(args); return response()(); };
  assert.equal(await loadGoodsStoreDestination(location('?eventId=1&openStore=1&goodsId=keyring&url=https://evil.example'), fetcher), store);
  assert.equal(calls.length, 1);
  assert.match(calls[0][0], /^\/event-config\.json\?v=\d+$/);
  assert.equal(calls[0][1].cache, 'no-store');
  assert.deepEqual(calls[0][1].headers, { Accept: 'application/json' });
});

test('이벤트 종료·상품 삭제·링크 미설정·잘못된 구매 URL은 외부 이동을 거부한다', async () => {
  const cases = [[], [{ ...event, enabled: false }], [{ ...event, giftshop: null }],
    [{ ...event, giftshop: { items: [] } }], [{ ...event, giftshop: { items: [{ ...item, linkUrl: '' }] } }],
    [{ ...event, giftshop: { items: [{ ...item, linkUrl: 'javascript:alert(1)' }] } }]];
  for (const events of cases) await assert.rejects(loadGoodsStoreDestination(location(), response(events)));
});

test('중복·누락·잘못된 query와 HTTPS 미전환은 설정 조회 전에 거부한다', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return response()(); };
  for (const search of ['?eventId=1&goodsId=keyring', '?eventId=0&openStore=1&goodsId=keyring',
    '?eventId=2147483648&openStore=1&goodsId=keyring', '?eventId=1&openStore=1',
    '?eventId=1&openStore=1&goodsId=../other', '?eventId=1&eventId=2&openStore=1&goodsId=keyring',
    '?eventId=1&openStore=1&openStore=1&goodsId=keyring', '?eventId=1&openStore=1&goodsId=keyring&goodsId=other']) {
    await assert.rejects(loadGoodsStoreDestination(location(search), fetcher));
  }
  await assert.rejects(loadGoodsStoreDestination({ ...location(), protocol: 'http:' }, fetcher));
  assert.equal(calls, 0);
});

test('네트워크 장애는 이동 성공으로 처리하지 않고 다시 요청할 수 있다', async () => {
  await assert.rejects(loadGoodsStoreDestination(location(), async () => { throw new TypeError('network'); }), /불러오지 못/);
  assert.equal(await loadGoodsStoreDestination(location(), response()), store);
  assert.equal(isGoodsStoreRequest(location()), true);
  assert.equal(isGoodsStoreRequest(location('?eventId=1')), false);
});
