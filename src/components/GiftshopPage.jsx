import React, { useState } from 'react';
import { GoodsCard } from './EventGiftshop';
import { GOODS_SORTS, giftshopItems, giftshopNote, sortGoods } from '../lib/goods';
import { giftshopPage } from '../events/seongbukcheonContent';

export default function GiftshopPage({ event, onSelect, onClose, bridge, context }) {
  const [sort, setSort] = useState(GOODS_SORTS[0].value);
  const items = giftshopItems(event);
  const note = giftshopNote(event);
  return <section className="goods-page" aria-label="기프트숍 전체 목록" data-browser-ok>
    <header className="ranking-page-header">
      <button type="button" onClick={onClose} aria-label="이벤트 화면으로 돌아가기">← 돌아가기</button>
      <strong>{giftshopPage.title}</strong>
    </header>
    {note && <p className="goods-intro">{note}</p>}
    <div className="goods-sort-row">
      <span>상품 {items.length}개</span>
      <label>정렬 <select value={sort} onChange={(action) => setSort(action.target.value)} aria-label="굿즈 정렬">
        {GOODS_SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
    </div>
    {items.length
      ? <div className="goods-grid goods-all-grid">{sortGoods(items, sort).map((item) => <GoodsCard key={item.key} item={item} onSelect={onSelect} bridge={bridge} context={context} />)}</div>
      : <p className="goods-empty">준비 중인 굿즈를 곧 소개할게요.</p>}
  </section>;
}
