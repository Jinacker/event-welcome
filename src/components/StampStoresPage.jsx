import React, { useEffect, useState } from 'react';
import { stampSection, storesPage } from '../events/seongbukcheonContent';

// 앱과 같은 꽃 모양 별 아이콘과 등급별 배지 색상.
const MICHELIN_PATH = "M11.81 2c2.018 0 3.478 1.232 3.874 3.129l.016 .089l.172 -.057c.34 -.104 .684 -.16 1.055 -.175l.227 -.005c2.09 0 3.925 1.93 3.925 4.094c0 1.095 -.51 2.087 -1.364 2.835l-.118 .098l.06 .048c.88 .737 1.36 1.605 1.416 2.656l.006 .213c0 2.24 -1.739 4.094 -3.925 4.094c-.445 0 -.923 -.084 -1.374 -.233l-.043 .193c-.395 1.736 -1.806 2.933 -3.662 3.016l-.208 .005c-2.018 0 -3.477 -1.232 -3.873 -3.13l-.03 -.161l-.011 .006a4.1 4.1 0 0 1 -1.26 .243l-.226 .005c-2.09 0 -3.925 -1.93 -3.925 -4.094c0 -1.096 .51 -2.087 1.378 -2.84l.073 -.062l-.03 -.023c-.88 -.737 -1.359 -1.605 -1.415 -2.656l-.006 -.213c0 -2.239 1.74 -4.094 3.925 -4.094c.44 0 .92 .098 1.391 .27l.036 .013l.008 -.048c.331 -1.84 1.776 -3.125 3.7 -3.211z";
const RATINGS = {
  normal: { count: 1, color: '#FFCC33' },
  good: { count: 2, color: '#FFA832' },
  best: { count: 3, color: '#FF6200' },
  top5: { count: 4, color: '#E8192C' },
};

export default function StampStoresPage({ event, bridge, progress }) {
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const restaurants = event.stampTour?.restaurants ?? [];
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
      const rating = RATINGS[detail.recommendLevel];
      const earned = received.has(restaurant.id);
      return <button key={restaurant.id} type="button" disabled={!bridge.isNative}
        onClick={() => bridge.navigate('restaurant', { restaurantId: restaurant.id }).catch(() => setError('가게 화면을 열지 못했어요. 다시 시도해주세요.'))}>
        <div className="stamp-store-info">
          <span className="stamp-store-name">{restaurant.name}</span>
          {rating && <span className="stamp-store-rating" role="img" aria-label={`별 ${rating.count}개`} style={{ backgroundColor: rating.color }}>
            {Array.from({ length: rating.count }, (_, index) => <svg key={index} width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d={MICHELIN_PATH} fill="#FFFFFF" /></svg>)}
          </span>}
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
