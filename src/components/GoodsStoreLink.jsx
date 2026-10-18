import React, { useState } from 'react';
import { canOpenGoodsStore, goodsStoreUrl } from '../lib/goods';

export default function GoodsStoreLink({ item, bridge, context }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const url = goodsStoreUrl(item.linkUrl);
  if (!url || !canOpenGoodsStore(bridge, context)) return null;
  if (!bridge?.isNative) return <a className="goods-store-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${item.name} 스토어에서 보기`} data-browser-ok>스토어에서 보기 ↗</a>;
  const open = async () => {
    if (opening) return;
    setOpening(true); setError('');
    try { await bridge.share(url); }
    catch { setError('구매 링크를 공유하지 못했어요. 다시 시도해주세요.'); }
    finally { setOpening(false); }
  };
  return <>
    <button type="button" className="goods-store-link" aria-label={`${item.name} 스토어 링크 공유·복사`} disabled={opening} onClick={open}>{opening ? '공유창 여는 중…' : '스토어 링크 공유·복사'}</button>
    {error && <p className="goods-store-error" role="alert">{error}</p>}
  </>;
}
