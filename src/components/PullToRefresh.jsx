import React, { useEffect, useRef, useState } from 'react';
import { PULL_REFRESH_THRESHOLD, pullRefreshDistance } from '../lib/refresh';

export default function PullToRefresh({ onRefresh, children }) {
  const root = useRef(null);
  const callback = useRef(onRefresh);
  callback.current = onRefresh;
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const node = root.current;
    let alive = true;
    let busy = false;
    let start = null;
    let pulled = 0;
    const reset = () => { start = null; pulled = 0; if (alive) setDistance(0); };
    const refresh = async () => {
      if (busy) return;
      busy = true; setRefreshing(true); setError('');
      try {
        const results = await Promise.allSettled([Promise.resolve().then(() => callback.current()), new Promise((resolve) => setTimeout(resolve, 350))]);
        if (results[0].status === 'rejected' && alive) setError('새로고침하지 못한 정보가 있어요. 다시 당겨서 시도해주세요.');
      } finally { busy = false; if (alive) setRefreshing(false); }
    };
    const begin = (event) => {
      reset();
      if (busy || window.scrollY > 0 || event.touches.length !== 1
        || event.target.closest?.('input, textarea, select, .event-hot-feed, .ranking-list, [data-no-pull-refresh]')) return;
      const touch = event.touches[0];
      start = { clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier };
    };
    const move = (event) => {
      if (!start || busy) return;
      const touch = event.touches[0];
      if (event.touches.length !== 1 || !touch || touch.identifier !== start.identifier
        || (Math.abs(touch.clientX - start.clientX) > Math.abs(touch.clientY - start.clientY) && Math.abs(touch.clientX - start.clientX) > 8)) { reset(); return; }
      pulled = pullRefreshDistance(start, touch, window.scrollY, event.touches.length);
      if (pulled > 0 && event.cancelable) event.preventDefault();
      setDistance(pulled);
    };
    const finish = () => {
      const ready = pulled >= PULL_REFRESH_THRESHOLD;
      reset();
      if (ready) refresh();
    };
    node.addEventListener('touchstart', begin, { passive: true });
    node.addEventListener('touchmove', move, { passive: false });
    node.addEventListener('touchend', finish);
    node.addEventListener('touchcancel', reset);
    return () => {
      alive = false;
      node.removeEventListener('touchstart', begin);
      node.removeEventListener('touchmove', move);
      node.removeEventListener('touchend', finish);
      node.removeEventListener('touchcancel', reset);
    };
  }, []);
  const visible = refreshing || distance > 0;
  return <div ref={root} className="pull-refresh-page" aria-busy={refreshing}>
    <div className="pull-refresh-indicator" role="status" aria-live="polite" style={{ height: refreshing ? 52 : distance, opacity: visible ? 1 : 0 }}>
      {visible && <><span className={`pull-refresh-spinner ${refreshing ? 'is-spinning' : ''}`} aria-hidden="true" />
        <span>{refreshing ? '새로고침 중...' : distance >= PULL_REFRESH_THRESHOLD ? '놓으면 새로고침' : '아래로 당겨 새로고침'}</span></>}
    </div>
    {error && <p className="pull-refresh-error" role="alert">{error}</p>}
    {children}
  </div>;
}
