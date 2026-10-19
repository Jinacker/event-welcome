import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewardStock } from './rewards.js';
import { rewards } from '../events/seongbukcheonContent.js';

const event = (luckyDraw) => ({ id: 1, publicData: luckyDraw === undefined ? {} : { luckyDraw } });

test('관리자 설정이 없으면 웹에 적어둔 기본 목록을 쓴다', () => {
  for (const value of [undefined, {}, { items: [] }, { items: 'nope' }, { items: [{ name: ' ' }] }, 'broken']) {
    const stock = rewardStock(event(value));
    assert.deepEqual(stock.items.map((item) => item.name), rewards.inventory.map((item) => item.name));
    assert.deepEqual(stock.items.map((item) => item.stock), rewards.inventory.map((item) => item.stock));
    assert.equal(stock.items.every((item) => item.soldOut === false), true);
    assert.equal(stock.updatedLabel, '');
  }
  assert.deepEqual(rewardStock(undefined).items.length, rewards.inventory.length);
  assert.deepEqual(rewardStock({}).items.length, rewards.inventory.length);
});

test('관리자가 넣은 수량을 순서대로 쓰고 이름 없는 줄은 버린다', () => {
  const stock = rewardStock(event({ items: [
    { name: '  스티커팩  ', stock: ' 10개 ' },
    { name: '', stock: '3개' },
    { name: '뱃지' },
  ] }));
  assert.deepEqual(stock.items, [
    { name: '스티커팩', stock: '10개', soldOut: false },
    { name: '뱃지', stock: '', soldOut: false },
  ]);
});

test('0개와 품절 표기는 품절로 본다', () => {
  const stock = rewardStock(event({ items: [
    { name: 'a', stock: '0개' },
    { name: 'b', stock: '품절' },
    { name: 'c', stock: '2개', soldOut: true },
    { name: 'd', stock: '10개' },
    { name: 'e', stock: '10개', soldOut: 'true' },
  ] }));
  assert.deepEqual(stock.items.map((item) => item.soldOut), [true, true, true, false, false]);
});

test('이름·수량 길이와 항목 수를 제한한다', () => {
  const stock = rewardStock(event({ items: Array.from({ length: 40 }, (unused, index) => ({ name: `${'가'.repeat(60)}${index}`, stock: '1'.repeat(40) })) }));
  assert.equal(stock.items.length, 30);
  assert.equal(stock.items[0].name.length, 40);
  assert.equal(stock.items[0].stock.length, 20);
});

test('수정한 날은 날짜 표기만 날짜로 읽는다', () => {
  const label = (updatedAt) => rewardStock(event({ items: [{ name: 'a', stock: '1개' }], updatedAt })).updatedLabel;
  assert.equal(label('2026-10-19'), '10월 19일 기준');
  assert.equal(label('2026-11-01'), '11월 1일 기준');
  assert.equal(label('10/19 21:00'), '10/19 21:00 기준');
  assert.equal(label(''), '');
  assert.equal(label(undefined), '');
  assert.equal(label(20261019), '');
  assert.equal(label('a\nb'), 'a b 기준');
});

test('수량 설정이 비면 수정한 날도 보여주지 않는다', () => {
  assert.equal(rewardStock(event({ items: [], updatedAt: '2026-10-19' })).updatedLabel, '');
});
