import React, { useState } from 'react';
import { storesPage } from '../events/seongbukcheonContent';

export default function StampStoresPage({ event, bridge, goal, progress, onClose }) {
  const [error, setError] = useState('');
  const restaurants = event.stampTour?.restaurants ?? [];
  const received = new Set(progress?.stamps?.map((item) => item.restaurantId) ?? []);
  const earnedCount = restaurants.filter((restaurant) => received.has(restaurant.id)).length;
  const remaining = Math.max(0, goal - (progress?.earned ?? 0));
  return <section className="stores-page" aria-label="산책 지도 가게 목록" data-browser-ok>
    <header className="ranking-page-header">
      <button type="button" onClick={onClose} aria-label="이벤트 화면으로 돌아가기">← 돌아가기</button>
      <strong>{storesPage.title}</strong>
    </header>
    {progress
      ? <>
        <h2>{earnedCount}곳 획득 · 완주까지 {remaining}곳</h2>
        <p className="map-editorial-note">{storesPage.editorialNote}</p>
        <p className="stores-note">획득 {earnedCount}곳 · 미획득 {Math.max(0, restaurants.length - earnedCount)}곳<br />서로 다른 가게 {goal}곳의 방문 기록을 앱에 남기면 완주합니다.</p>
      </>
      : <>
        <h2>지도에 소개한 가게 {restaurants.length}곳</h2>
        <p className="map-editorial-note">{storesPage.editorialNote}</p>
        <p className="stores-pending" role="status">{storesPage.pending}</p>
      </>}
    <div className="stamp-restaurants">{restaurants.map((restaurant) => <button key={restaurant.id} type="button" disabled={!bridge.isNative}
      className={received.has(restaurant.id) ? 'stamp-store-earned' : undefined}
      onClick={() => bridge.navigate('restaurant', { restaurantId: restaurant.id }).catch(() => setError('가게 화면을 열지 못했어요. 다시 시도해주세요.'))}>
      <span>{restaurant.name}</span><small>{received.has(restaurant.id) ? '획득 ✓' : '미획득'}</small>
    </button>)}</div>
    {error && <p role="alert" className="map-editorial-note">{error}</p>}
  </section>;
}
