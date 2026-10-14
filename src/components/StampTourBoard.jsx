import { useEventRefresh } from './EventRefreshContext';
import { singleFlight } from '../lib/refresh';
import React, { useEffect, useRef, useState } from 'react';
import { stampSlots } from '../lib/stamps';
import { appStoreUrl } from '../lib/events';

export default function StampTourBoard({ event, bridge }) {
  const tour = event.stampTour;
  const eventRefresh = useEventRefresh();
  const reloadRef = useRef(async () => {});
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    if (!bridge.isNative) return;
    setLoading(true);
    try { await reloadRef.current(); }
    catch { setError('스탬프를 불러오지 못했어요. 다시 시도해주세요.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    setProgress(null);
    if (!tour?.enabled) return;
    let cancelled = false;
    const load = singleFlight(async () => {
      if (!bridge.isNative) return;
      try { const result = await bridge.api('/stamps'); if (!cancelled) { setProgress(result); setError(''); } }
      catch (cause) { if (!cancelled) setError('스탬프를 불러오지 못했어요. 다시 시도해주세요.'); throw cause; }
    });
    reloadRef.current = load;
    const unregister = eventRefresh.register(load);
    const reload = () => { load().catch(() => {}); };
    reload();
    const interval = setInterval(reload, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; unregister(); clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [event.id, tour?.enabled, bridge, eventRefresh]);
  if (!tour?.enabled) return null;
  const restaurants = tour.restaurants ?? [];
  const earned = progress?.earned ?? 0;
  const slots = stampSlots(restaurants.length, earned);
  const received = new Set(progress?.stamps?.map((stamp) => stamp.restaurantId) ?? []);
  const Slot = bridge.isNative ? 'div' : 'button';
  return <section className="stamp-tour" aria-label="스탬프 투어">
    <div className="stamp-summary"><div><strong>{progress ? earned : '—'} / {slots.length}</strong><p>현재 모은 스탬프</p></div><span>{progress ? `완주까지 ${Math.max(0, restaurants.length - earned)}곳` : '내 스탬프'}</span></div>
    <div className="stamp-progress" role="progressbar" aria-label="스탬프 진행률" aria-valuemin={0} aria-valuemax={Math.max(1, slots.length)} aria-valuenow={earned}>
      <span style={{ width: `${Math.min(100, earned / Math.max(1, slots.length) * 100)}%` }} />
    </div>
    <p className="stamp-guide">참여 가게에 새 공개 기록을 남겨주세요.<br />사진 1장 이상·후기 30자 이상이면 가게별 스탬프 1장을 받아요.</p>
    {!bridge.isNative && <a className="app-button" href={appStoreUrl(window.navigator)}>앱에서 내 스탬프 보기</a>}
    {bridge.isNative && !progress && !error && <p role="status">스탬프를 불러오는 중...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={refresh} disabled={loading}>다시 시도</button></div>}
    <div className="stamp-grid" aria-label={`스탬프 ${earned}개`}>
      {slots.map((filled, index) => <Slot key={index} className={`stamp-slot ${filled ? 'filled' : ''}`} aria-label={`${index + 1}번째 ${filled ? '획득' : '빈'} 스탬프`}>
        {filled ? <img src={tour.stampImageUrl} alt="획득한 스탬프" /> : <span>{index + 1}</span>}
      </Slot>)}
    </div>
    <h2>참여 가게 <small>{restaurants.length}곳</small></h2>
    <div className="stamp-restaurants">{restaurants.map((restaurant) => <button key={restaurant.id}
      onClick={() => bridge.navigate('restaurant', { restaurantId: restaurant.id }).catch(() => setError('가게 화면을 열지 못했어요. 다시 시도해주세요.'))}>
      <span>{restaurant.name}</span><small>{received.has(restaurant.id) ? '획득 ✓' : '미획득'}</small>
    </button>)}</div>
  </section>;
}
