import React, { useState } from 'react';
import StampTourBoard from '../components/StampTourBoard';
import EventActivity from '../components/EventActivity';
import EventCalendar from '../components/EventCalendar';
export default function Seongbukcheon({ event, bridge, context }) {
  const [error, setError] = useState('');
  const openMap = async () => {
    if (!context?.navigationTargets?.includes('event_map')) { setError('이벤트 맛집 지도를 보려면 돈가스 지도를 최신 버전으로 업데이트해주세요.'); return; }
    try { await bridge.navigate('event_map', { eventId: event.id }); }
    catch { setError('지도를 열지 못했어요. 다시 시도해주세요.'); }
  };
  return <>
    <section className="hero"><p className="eyebrow">KATSU MAP · SEONGBUKCHEON</p><h1>성북천 따라<br />돈가스 한 바퀴</h1><p>성북천에서 만나는 돈가스 이야기.<br />참여 가게를 방문하고 스탬프를 모아보세요.</p></section>
    <EventActivity event={event} bridge={bridge} />
    <StampTourBoard event={event} bridge={bridge} />
    <EventCalendar event={event} />
    <section className="event-course"><div className="section-heading"><h2>성북천 맛집 지도</h2><span>{event.stampTour?.restaurants?.length ?? 0}곳</span></div>
      <button className="course-preview" aria-label="성북천 맛집 지도와 가게 목록 열기" onClick={openMap} disabled={!bridge.isNative}>
        <div className="river" /><span className="course-pin pin-one">🥩</span><span className="course-pin pin-two">🥩</span><span className="course-pin pin-three">🥩</span><span className="course-label">참여 가게만 지도에서 보기 ↗</span>
      </button><p className="course-help">지도를 누르면 참여 가게의 위치와 가게 목록을 볼 수 있어요.</p>{error && <p role="alert" className="course-help">{error}</p>}
    </section>
    <section className="intro-card"><span className="pill">이벤트 안내</span><h2>{event.title}</h2><p>{typeof event.publicData?.description === 'string' ? event.publicData.description : '참여 가게에서 돈가스를 즐기고 공개 기록을 남겨주세요.'}</p></section>
  </>;
}
