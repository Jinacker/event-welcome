import React from 'react';
import { giftshopItems, giftshopNote } from '../lib/goods';
import GoodsStoreLink from './GoodsStoreLink';
import { goodsStoreHref } from '../lib/goodsNavigation';

const PREVIEW = 4;

// 미리보기 칸에만 얹는 장식 그림. 칸 순서대로 붙이고 없으면 그대로 둔다.
const STICKERS = ['', 'shirt', 'duck'];

export function GoodsCard({ item, event, onSelect, bridge, sticker }) {
  // 여백 유지(투명 배경 굿즈)는 사진을 잘라내지 않고 흰 바탕에 그대로 보여준다.
  const photoClass = `goods-photo${item.fit === 'contain' ? ' goods-photo-keyring' : ''}`;
  const linked = !!goodsStoreHref(event, item, !!bridge?.isNative);
  const photo = item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : null;
  return <article className="goods-item">
    {linked ? <GoodsStoreLink item={item} event={event} bridge={bridge} className={photoClass}>{photo ?? <span aria-hidden="true" />}</GoodsStoreLink> : item.imageUrl
      ? <button type="button" className={photoClass} aria-label={`${item.name} 사진 크게 보기`} onClick={() => onSelect(item)}>
        {photo}
      </button>
      : <div className={photoClass} aria-hidden="true" />}
    <h3>{linked ? <GoodsStoreLink item={item} event={event} bridge={bridge} className="goods-name-link">{item.name}</GoodsStoreLink> : item.name}</h3>
    {item.price && <p>{item.price}</p>}
    {sticker && <img className={`goods-sticker sticker-${sticker}`} src={`/goods-sticker-${sticker}.png`} alt="" aria-hidden="true" />}
  </article>;
}

export default function EventGiftshop({ event, onOpenPage, onSelect, bridge }) {
  const items = giftshopItems(event);
  if (!items.length) return null;
  const note = giftshopNote(event);
  return <section className="goods-section" aria-label="기프트숍" data-browser-ok>
    <div className="section-heading">
      <h2>기프트숍</h2>
      {items.length > PREVIEW && <button type="button" className="goods-more" aria-label="기프트숍 전체 보기" onClick={onOpenPage}>→</button>}
    </div>
    {note && <p className="goods-intro">{note}</p>}
    <div className="goods-grid">{items.slice(0, PREVIEW).map((item, index) => <GoodsCard key={item.key} item={item} event={event} onSelect={onSelect} bridge={bridge} sticker={STICKERS[index]} />)}</div>
  </section>;
}
