import React from 'react';
import { giftshopItems, giftshopNote } from '../lib/goods';

const PREVIEW = 4;

export function GoodsCard({ item, onSelect }) {
  // 여백 유지(투명 배경 굿즈)는 사진을 잘라내지 않고 흰 바탕에 그대로 보여준다.
  const photoClass = `goods-photo${item.fit === 'contain' ? ' goods-photo-keyring' : ''}`;
  return <article className="goods-item">
    {item.imageUrl
      ? <button type="button" className={photoClass} aria-label={`${item.name} 사진 크게 보기`} onClick={() => onSelect(item)}>
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
      </button>
      : <div className={photoClass} aria-hidden="true" />}
    <h3>{item.name}</h3>
    {item.price && <p>{item.price}</p>}
  </article>;
}

export default function EventGiftshop({ event, onOpenPage, onSelect }) {
  const items = giftshopItems(event);
  if (!items.length) return null;
  const note = giftshopNote(event);
  return <section className="goods-section" aria-label="기프트숍" data-browser-ok>
    <div className="section-heading">
      <h2>기프트숍</h2>
      {items.length > PREVIEW && <button type="button" className="goods-more" aria-label="기프트숍 전체 보기" onClick={onOpenPage}>→</button>}
    </div>
    {note && <p className="goods-intro">{note}</p>}
    <div className="goods-grid">{items.slice(0, PREVIEW).map((item) => <GoodsCard key={item.key} item={item} onSelect={onSelect} />)}</div>
  </section>;
}
