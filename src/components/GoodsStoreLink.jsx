import React from 'react';
import { goodsStoreHref } from '../lib/goodsNavigation';

export default function GoodsStoreLink({ item, event, bridge, className, children }) {
  const native = !!bridge?.isNative;
  const href = goodsStoreHref(event, item, native);
  if (!href) return null;
  return <a className={className} href={href} target={native ? '_self' : '_blank'} rel="noopener noreferrer"
    aria-label={`${item.name} 스토어로 이동`} data-browser-ok>{children}</a>;
}
