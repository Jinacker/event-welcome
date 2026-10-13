import EventIcon from '../components/EventIcon';
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
    <section className="hero">
      <div className="hero-top"><span className="hero-badge">돈가스 지도 · 스탬프 투어</span><span className="hero-location"><EventIcon name="pin" size={12} />성북천</span></div>
      <div className="hero-content"><div><h1>성북천 따라<br />돈가스 한 바퀴</h1><p>참여 가게에서 맛있는 기록을 남기고<br />나만의 돈가스 여행을 완성해보세요.</p></div>
        {event.buttonImageUrl && <img className="hero-event-logo" src={event.buttonImageUrl} alt={event.title} />}
      </div>
      <div className="hero-bottom"><span>사진 1장 · 후기 30자 · 공개 기록</span><strong>{event.stampTour?.restaurants?.length ?? 0}곳의 맛있는 발견</strong></div>
    </section>
    <EventActivity event={event} bridge={bridge} />
    <StampTourBoard event={event} bridge={bridge} />
    <EventCalendar event={event} />
    <section className="event-course"><div className="section-heading"><h2>성북천 맛집 지도</h2><span>{event.stampTour?.restaurants?.length ?? 0}곳</span></div>
      <button className="course-preview" aria-label="성북천 맛집 지도와 가게 목록 열기" onClick={openMap} disabled={!bridge.isNative}>
        <div className="river" /><span className="course-pin pin-one"><EventIcon name="pin" size={24} filled /></span><span className="course-pin pin-two"><EventIcon name="pin" size={24} filled /></span><span className="course-pin pin-three"><EventIcon name="pin" size={24} filled /></span><span className="course-label">참여 가게만 지도에서 보기 ↗</span>
      </button><p className="course-help">지도를 누르면 참여 가게의 위치와 가게 목록을 볼 수 있어요.</p>{error && <p role="alert" className="course-help">{error}</p>}
    </section>
    <section className="intro-card"><span className="pill">이벤트 안내</span><h2>{event.title}</h2><p>{typeof event.publicData?.description === 'string' ? event.publicData.description : '참여 가게에서 돈가스를 즐기고 공개 기록을 남겨주세요.'}</p></section>
  </>;
}
