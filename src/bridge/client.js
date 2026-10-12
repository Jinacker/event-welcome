export const BRIDGE_METHODS = ['context.get', 'api.request', 'location.get', 'image.pick', 'navigation.open', 'share', 'haptic', 'close'];

export function createEventBridge(win = window) {
  const pending = new Map();
  const waiting = new Set();
  let sequence = 0;
  let disposed = false;
  const receive = (event) => {
    const message = event.detail;
    if (!message || message.nonce !== win.__KATSU_EVENT__?.nonce || !pending.has(message.id)) return;
    const item = pending.get(message.id);
    clearTimeout(item.timer); pending.delete(message.id);
    if (message.ok) item.resolve(message.result);
    else { const error = new Error(message.error?.message || '앱 요청에 실패했습니다.'); error.code = message.error?.code; item.reject(error); }
  };
  win.addEventListener('katsu-event-response', receive);

  const ready = () => new Promise((resolve, reject) => {
    if (win.ReactNativeWebView?.postMessage && win.__KATSU_EVENT__?.nonce) { resolve(); return; }
    const cleanup = () => { clearTimeout(timer); win.removeEventListener('katsu-event-ready', listener); waiting.delete(abort); };
    const abort = () => { cleanup(); reject(new Error('이벤트 페이지가 닫혔습니다.')); };
    const listener = () => { if (win.ReactNativeWebView?.postMessage && win.__KATSU_EVENT__?.nonce) { cleanup(); resolve(); } };
    const timer = setTimeout(() => { cleanup(); reject(new Error('앱 연결을 준비하지 못했습니다. 다시 열어주세요.')); }, 6000);
    win.addEventListener('katsu-event-ready', listener);
    waiting.add(abort);
  });

  const request = async (method, payload) => {
    if (disposed || !BRIDGE_METHODS.includes(method)) throw new Error('지원하지 않는 앱 요청입니다.');
    await ready();
    if (disposed || pending.size >= 8) throw new Error('앱 요청을 잠시 후 다시 시도해주세요.');
    const id = `req_${Date.now()}_${++sequence}`;
    const json = JSON.stringify({ channel: 'katsu-event', version: 1, nonce: win.__KATSU_EVENT__.nonce, id, method, payload });
    if (json.length > (method === 'api.request' ? 3 * 1024 * 1024 : 32768)) throw new Error('앱 요청 내용이 너무 큽니다.');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('앱 요청 시간이 초과되었습니다.')); }, method === 'image.pick' || method === 'location.get' ? 120000 : 30000);
      pending.set(id, { resolve, reject, timer });
      try { win.ReactNativeWebView.postMessage(json); }
      catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
    });
  };
  return {
    get isNative() { return !!win.ReactNativeWebView?.postMessage; }, request,
    getContext: () => request('context.get'), api: (path, options = {}) => request('api.request', { path, ...options }),
    getLocation: () => request('location.get'), pickImage: () => request('image.pick'),
    navigate: (target, params = {}) => request('navigation.open', { version: 1, target, params }),
    share: (message) => request('share', { message }), haptic: (style = 'light') => request('haptic', { style }), close: () => request('close'),
    dispose: () => { disposed = true; win.removeEventListener('katsu-event-response', receive); for (const abort of waiting) abort(); for (const item of pending.values()) { clearTimeout(item.timer); item.reject(new Error('이벤트 페이지가 닫혔습니다.')); } pending.clear(); },
  };
}
