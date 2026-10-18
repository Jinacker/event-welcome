import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOODS_SORTS, giftshopItems, giftshopNote, goodsPrice, sortGoods } from './goods.js';

const event = (giftshop) => ({ id: 1, giftshop });
const photo = 'https://storage.googleapis.com/katsu-map-images/event-goods/1_a.jpg';

test('관리자 굿즈를 진열 순서대로 정리하고 기본 표시 방식을 채운다', () => {
  const items = giftshopItems(event({ note: ' 현장 할인 ', items: [
    { id: 'keyring', name: ' 돈가스 NFC 키링 ', price: ' 11,000원 ', imageUrl: photo, fit: 'contain' },
    { id: 'tee', name: '티셔츠' },
  ] }));
  assert.deepEqual(items, [
    { key: 'keyring', name: '돈가스 NFC 키링', price: '11,000원', imageUrl: photo, fit: 'contain', order: 0 },
    { key: 'tee', name: '티셔츠', price: '', imageUrl: '', fit: 'cover', order: 1 },
  ]);
  assert.equal(giftshopNote(event({ note: ' 현장 할인 ' })), '현장 할인');
});

test('기프트숍이 없거나 이름·사진이 잘못된 굿즈는 화면에서 빠진다', () => {
  for (const giftshop of [undefined, null, {}, { items: null }, { items: [{ id: 'a', name: '  ' }, {}] }]) {
    assert.deepEqual(giftshopItems(event(giftshop)), []);
  }
  for (const imageUrl of ['javascript:alert(1)', 'http://example.com/a.jpg', 123]) {
    assert.equal(giftshopItems(event({ items: [{ id: 'a', name: '굿즈', imageUrl }] }))[0].imageUrl, '');
  }
  assert.equal(giftshopItems(event({ items: [{ id: 'a', name: '굿즈', imageUrl: '/demo-katsu.svg' }] }))[0].imageUrl, '/demo-katsu.svg');
  assert.equal(giftshopNote(event(undefined)), '');
});

test('가격 정렬은 숫자만 비교하고 가격 없는 굿즈를 뒤로 보낸다', () => {
  const items = giftshopItems(event({ items: [
    { id: 'a', name: '스티커팩', price: '6,000원' }, { id: 'b', name: '핀버튼', price: '1,500원' },
    { id: 'c', name: '티셔츠', price: '30,000원' }, { id: 'd', name: '비매품' },
  ] }));
  assert.deepEqual(sortGoods(items, 'low').map((item) => item.name), ['핀버튼', '스티커팩', '티셔츠', '비매품']);
  assert.deepEqual(sortGoods(items, 'high').map((item) => item.name), ['티셔츠', '스티커팩', '핀버튼', '비매품']);
  assert.deepEqual(sortGoods(items, 'listed').map((item) => item.name), ['스티커팩', '핀버튼', '티셔츠', '비매품']);
  assert.deepEqual(sortGoods(items, undefined).map((item) => item.name), items.map((item) => item.name));
  assert.equal(items.length, 4);
});

test('가격 문자열에서 금액을 뽑고 정렬 옵션 값을 유지한다', () => {
  assert.equal(goodsPrice('11,000원'), 11000);
  assert.equal(goodsPrice('무료'), null);
  assert.equal(goodsPrice(undefined), null);
  assert.deepEqual(GOODS_SORTS.map((sort) => sort.value), ['listed', 'low', 'high']);
});
