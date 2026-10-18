import React, { useEffect } from 'react';
import { VENUE_URL } from '../lib/venueNavigation';

export default function VenueRedirectPage() {
  useEffect(() => { window.location.replace(VENUE_URL); }, []);
  return <main className="status-page">
    <p role="status">라운지 돌돌 지도로 이동하고 있어요.</p>
    <a href={VENUE_URL}>지도 열기</a>
  </main>;
}
