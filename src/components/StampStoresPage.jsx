import React, { useEffect, useState } from 'react';
import { stampSection, storeOrder, storesPage } from '../events/seongbukcheonContent';
import { sortStores } from '../lib/storeOrder';

export default function StampStoresPage({ event, bridge, progress }) {
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const restaurants = sortStores(event.stampTour?.restaurants ?? [], storeOrder);
  const received = new Set(progress?.stamps?.map((item) => item.restaurantId) ?? []);
  const byId = new Map(details.map((restaurant) => [restaurant.id, restaurant]));
  useEffect(() => {
    let cancelled = false;
    setDetails([]);
    if (bridge.isNative) {
      bridge.api('/map').then((result) => {
        if (!cancelled) setDetails(Array.isArray(result?.restaurants) ? result.restaurants : []);
      }).catch(() => {
        // 부가 정보 조회 실패에도 기존 가게 목록과 스탬프는 유지한다.
      });
    }
    return () => { cancelled = true; };
  }, [event.id, bridge]);
  return <section className="stores-page" aria-label="산책 지도 가게 목록" data-browser-ok>
    <header className="ranking-page-header"><strong>{storesPage.title}</strong></header>
    <p className="map-editorial-note">{storesPage.editorialNote}</p>
    {!progress && <p className="stores-pending" role="status">{storesPage.pending}</p>}
    <div className="stamp-restaurants">{restaurants.map((restaurant) => {
      const detail = byId.get(restaurant.id) ?? restaurant;
      const earned = received.has(restaurant.id);
      return <button key={restaurant.id} type="button" disabled={!bridge.isNative}
        onClick={() => bridge.navigate('restaurant', { restaurantId: restaurant.id }).catch(() => setError('가게 화면을 열지 못했어요. 다시 시도해주세요.'))}>
        <div className="stamp-store-info">
          <span className="stamp-store-name">{restaurant.name}</span>
          {detail.category && <span className="stamp-store-category">{detail.category}</span>}
        </div>
        <div className={`stamp-slot stamp-store-status${earned ? ' filled' : ''}`} role="img"
          aria-label={!progress ? '스탬프 확인 중' : earned ? '스탬프 획득' : '스탬프 미획득'}>
          {earned && <span className="earned-stamp-mark" aria-hidden="true">{stampSection.mark.map((line) => <span key={line}>{line}</span>)}</span>}
        </div>
      </button>;
    })}</div>
    {error && <p role="alert" className="map-editorial-note">{error}</p>}
  </section>;
}
