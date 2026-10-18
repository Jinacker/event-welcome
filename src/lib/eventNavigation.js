// 같은 URL의 History 항목으로 웹 내부 화면·팝업만 이동한다.
// 앱의 네이티브 뒤로 가기는 이 모듈에 전달되지 않는다.
export function createEventNavigation(browser) {
  const session = `${Date.now()}-${Math.random()}`;
  let snapshot = { page: null, dialog: null };
  let index = 0;
  let pending = false;
  const listeners = new Set();
  const emit = () => { for (const listener of listeners) listener(); };
  const state = () => ({ ...browser.history.state, katsuEventNavigation: { session, index, ...snapshot } });
  const pop = (event) => {
    const value = event.state?.katsuEventNavigation;
    if (value?.session !== session) return;
    index = value.index;
    snapshot = { page: value.page, dialog: value.dialog };
    pending = false;
    emit();
  };
  const push = (next) => {
    if (pending) return;
    snapshot = next;
    index += 1;
    browser.history.pushState(state(), '');
    emit();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    start: () => {
      browser.history.replaceState(state(), '');
      browser.addEventListener('popstate', pop);
      return () => browser.removeEventListener('popstate', pop);
    },
    openPage: (page) => push({ page, dialog: null }),
    openDialog: (dialog) => push({ ...snapshot, dialog }),
    back: () => {
      if (!snapshot.page && !snapshot.dialog) return false;
      if (!pending) { pending = true; browser.history.back(); }
      return true;
    },
  };
}
