export const APP_HOME_LINK = 'katsumap://';
export const CONFIG_URL = '/event-config.json';
const isId = (value) => Number.isInteger(value) && value > 0 && value <= 2147483647;
export function appEventLink(id, search = '') {
  const query = new URLSearchParams();
  let count = 0;
  for (const [key, value] of new URLSearchParams(search)) {
    if (count >= 10) break;
    if (/^[a-zA-Z0-9_-]{1,40}$/.test(key) && value.length <= 512 && !['eventId', 'native', '__proto__', 'constructor', 'prototype'].includes(key)) { query.set(key, value); count++; }
  }
  return `katsumap://event/${id}${query.size ? `?${query}` : ''}`;
}

export function resolveEventId(pathname, search, events = []) {
  const match = pathname.match(/^\/event\/(\d+)\/?$/);
  const raw = match?.[1] ?? new URLSearchParams(search).get('eventId');
  if (raw !== null && raw !== undefined) return /^\d+$/.test(raw) && isId(Number(raw)) ? Number(raw) : null;
  const candidates = events.filter((event) => pathname === '/' || event.webPath === pathname);
  return candidates.find((event) => event.enabled)?.id ?? candidates.sort((a, b) => b.id - a.id)[0]?.id ?? null;
}
export function inactiveRedirect({ openHome, schedule = setTimeout, cancel = clearTimeout }) {
  const timer = schedule(openHome, 2000);
  return () => cancel(timer);
}
export async function fetchJson(url, fetcher = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) { const error = new Error('이벤트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'); error.code = String(response.status); throw error; }
    const data = await response.json(); return data?.data ?? data;
  } catch (cause) {
    if (cause.name === 'AbortError' || cause instanceof TypeError) throw new Error('이벤트 설정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    throw cause;
  } finally { clearTimeout(timer); }
}
export async function loadBrowserEvent(location, fetcher = fetch) {
  const config = await fetchJson(`${CONFIG_URL}?v=${Math.floor(Date.now() / 60000)}`, fetcher);
  if (!Array.isArray(config?.events)) throw new Error('이벤트 설정을 확인하지 못했어요. 잠시 후 다시 시도해주세요.');
  const events = config.events.filter((event) => event && isId(event.id) && typeof event.enabled === 'boolean' && typeof event.webPath === 'string');
  const id = resolveEventId(location.pathname, location.search, events);
  const event = events.find((item) => item.id === id);
  if (!event) throw new Error('이벤트를 찾을 수 없습니다.');
  return event;
}
