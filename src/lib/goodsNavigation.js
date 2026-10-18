import { goodsStoreUrl } from './goods.js';
import { loadBrowserEvent } from './events.js';

const validEventId = (value) => Number.isInteger(value) && value > 0 && value <= 2147483647;
const validGoodsId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function goodsStoreHref(event, item, native = false) {
  const destination = goodsStoreUrl(item?.linkUrl);
  if (!destination || !native) return destination;
  const goodsId = item.id ?? item.key;
  if (!validEventId(event?.id) || !validGoodsId(goodsId)) return '';
  // 현재 앱의 WebView는 http 탐색을 기기 브라우저로 넘기고 페이지 이동을 취소한다.
  // 브라우저에서는 Vercel의 HTTPS 전환 후 공개 설정에서 구매 URL을 확인한다.
  // 이 진입 주소에는 공개 ID만 넣고 세션·사용자 정보·임의 목적지 URL은 넣지 않는다.
  const entry = new URL('http://event-welcome.vercel.app/');
  entry.searchParams.set('eventId', String(event.id));
  entry.searchParams.set('openStore', '1');
  entry.searchParams.set('goodsId', goodsId);
  return entry.toString();
}

export function isGoodsStoreRequest(location) {
  return new URLSearchParams(location.search).get('openStore') === '1';
}

export async function loadGoodsStoreDestination(location, fetcher = fetch) {
  const query = new URLSearchParams(location.search);
  const rawId = query.get('eventId');
  const eventId = /^\d+$/.test(rawId ?? '') ? Number(rawId) : null;
  const goodsId = query.get('goodsId');
  if (!isGoodsStoreRequest(location) || !validEventId(eventId) || !validGoodsId(goodsId)
    || ['eventId', 'goodsId', 'openStore'].some((key) => query.getAll(key).length !== 1)) {
    throw new Error('상품 링크를 확인할 수 없어요. 이벤트에서 다시 선택해주세요.');
  }
  if (location.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    throw new Error('안전한 상품 링크로 연결하지 못했어요. 이벤트에서 다시 선택해주세요.');
  }
  const event = await loadBrowserEvent({ pathname: '/', search: `?eventId=${eventId}` }, fetcher);
  if (!event.enabled) throw new Error('현재 이벤트가 종료되어 상품 링크를 열 수 없어요.');
  const items = Array.isArray(event.giftshop?.items) ? event.giftshop.items : [];
  const item = items.find((goods) => goods?.id === goodsId);
  const destination = goodsStoreUrl(item?.linkUrl);
  if (!destination) throw new Error('등록된 상품 링크가 없어요. 이벤트에서 다시 선택해주세요.');
  return destination;
}
