import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventNavigation } from './eventNavigation.js';

function fixture() {
  const entries = [{ routerState: 'preserve' }];
  let index = 0;
  const listeners = new Set();
  const events = [];
  const browser = {
    history: {
      get state() { return entries[index]; },
      replaceState(state) { entries[index] = structuredClone(state); },
      pushState(state, title, url) {
        assert.equal(url, undefined, 'URL·eventId·native query를 변경하지 않는다');
        entries.splice(index + 1); entries.push(structuredClone(state)); index += 1;
      },
      back() { if (index) { index -= 1; events.push({ state: entries[index] }); } },
      forward() { if (index < entries.length - 1) { index += 1; events.push({ state: entries[index] }); } },
    },
    addEventListener(name, listener) { assert.equal(name, 'popstate'); listeners.add(listener); },
    removeEventListener(name, listener) { listeners.delete(listener); },
  };
  const navigation = createEventNavigation(browser);
  const dispose = navigation.start();
  const flush = () => { for (const event of events.splice(0)) for (const listener of listeners) listener(event); };
  return { browser, navigation, flush, dispose, entries };
}

test('랭킹·가게·굿즈에서 뒤로 가면 홈으로 돌아가고 홈에서만 닫기를 허용한다', () => {
  for (const page of ['ranking', 'stores', 'goods']) {
    const { navigation, flush, browser } = fixture();
    assert.equal(navigation.back(), false);
    navigation.openPage(page);
    assert.equal(navigation.getSnapshot().page, page);
    assert.equal(navigation.back(), true);
    flush();
    assert.deepEqual(navigation.getSnapshot(), { page: null, dialog: null });
    assert.equal(navigation.back(), false);
    assert.equal(browser.history.state.routerState, 'preserve');
  }
});

test('굿즈 위 팝업은 목록을 유지하고 다음 뒤로 가기에서 홈으로 돌아간다', () => {
  const { navigation, flush } = fixture();
  navigation.openPage('goods');
  navigation.openDialog({ kind: 'goods', item: { key: '1', name: '굿즈' } });
  navigation.back(); flush();
  assert.deepEqual(navigation.getSnapshot(), { page: 'goods', dialog: null });
  navigation.back(); flush();
  assert.equal(navigation.getSnapshot().page, null);
});

test('빠른 뒤로 가기 중복 클릭은 한 단계만 이동하고 브라우저 앞으로 가기도 복원한다', () => {
  const { navigation, flush, browser } = fixture();
  navigation.openPage('goods'); navigation.openDialog({ kind: 'goods' });
  navigation.back(); navigation.back(); flush();
  assert.equal(navigation.getSnapshot().page, 'goods');
  assert.equal(navigation.getSnapshot().dialog, null);
  browser.history.forward(); flush();
  assert.equal(navigation.getSnapshot().dialog.kind, 'goods');
});

test('브라우저 뒤로 가기도 팝업만 닫으며 구독 정리 후에는 변경을 전달하지 않는다', () => {
  const { navigation, flush, browser, dispose } = fixture();
  let updates = 0;
  const unsubscribe = navigation.subscribe(() => { updates += 1; });
  navigation.openDialog({ kind: 'schedule' });
  browser.history.back(); flush();
  assert.deepEqual(navigation.getSnapshot(), { page: null, dialog: null });
  assert.equal(updates, 2);
  unsubscribe(); dispose();
  browser.history.forward(); flush();
  assert.equal(updates, 2);
});
