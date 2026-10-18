import EventIcon from '../components/EventIcon';
import React, { useLayoutEffect, useRef, useState } from 'react';
import StampTourBoard from '../components/StampTourBoard';
import StampRankingPage from '../components/StampRankingPage';
import StampStoresPage from '../components/StampStoresPage';
import EventActivity from '../components/EventActivity';
import EventCalendar from '../components/EventCalendar';
import EventGiftshop from '../components/EventGiftshop';
import GiftshopPage from '../components/GiftshopPage';
import { useStampProgress } from '../components/useStampProgress';
import { GoodsDialog, PolicyDialog, RewardsDialog, ScheduleDialog } from '../components/EventDialogs';
import { giftshopNote } from '../lib/goods';
import { calendarPeriod, longPeriodLabel } from '../lib/period';
import * as content from './seongbukcheonContent';
import { scheduleItems } from './seongbukcheonSchedule';
import { venueHref } from '../lib/venueNavigation';

const lines = (values) => values.map((line, index) => <React.Fragment key={line}>{index ? <br /> : null}{line}</React.Fragment>);

export default function Seongbukcheon({ event, bridge, context, navigation, navigationState }) {
  const [error, setError] = useState('');
  const { page, dialog } = navigationState;
  const scroll = useRef(0);
  const stamp = useStampProgress(event, bridge);
  const goal = content.stampSection.goal;
  const period = calendarPeriod(scheduleItems);
  const nickname = typeof context?.user?.nickname === 'string' ? context.user.nickname.trim() : '';
  const openPage = (name) => { scroll.current = window.scrollY; navigation.openPage(name); };
  // 서브 화면을 열면 맨 위에서 시작하고, 돌아오면 보던 위치로 되돌린다.
  useLayoutEffect(() => { window.scrollTo(0, page ? 0 : scroll.current); }, [page]);
  const openMap = async () => {
    if (!context?.navigationTargets?.includes('event_map')) { setError(content.mapSection.updateGuide); return; }
    try { await bridge.navigate('event_map', { eventId: event.id }); }
    catch { setError('지도를 열지 못했어요. 다시 시도해주세요.'); }
  };
  const closeDialog = () => navigation.back();
  const openGoods = (item) => navigation.openDialog({ kind: 'goods', item });
  const dialogs = <>
    {dialog?.kind === 'schedule' && <ScheduleDialog item={dialog.item} native={bridge.isNative} onClose={closeDialog} />}
    {dialog?.kind === 'rewards' && <RewardsDialog onClose={closeDialog} />}
    {dialog?.kind === 'policy' && <PolicyDialog goal={goal} stores={event.stampTour?.restaurants?.length ?? 0} period={period && longPeriodLabel(period.startDate, period.endDate)} onClose={closeDialog} />}
    {dialog?.kind === 'goods' && <GoodsDialog key={dialog.item.key} item={dialog.item} note={giftshopNote(event)} onClose={closeDialog} />}
  </>;
  if (page === 'ranking') return <>
    <StampRankingPage event={event} bridge={bridge} />{dialogs}
  </>;
  if (page === 'stores') return <>
    <StampStoresPage event={event} bridge={bridge} progress={stamp.progress} />{dialogs}
  </>;
  if (page === 'goods') return <>
    <GiftshopPage event={event} onSelect={openGoods} bridge={bridge} />{dialogs}
  </>;
  return <>
    <section className="hero type-banner" aria-label={`${content.banner.place} ${content.banner.titleLines.join(' ')}`}>
      <div className="banner-main-row">
        <div className="type-banner-title">
          <h1 className="banner-title-image"><img src="/seongbukcheon-title.png" width="1086" height="1448" alt="성북천 걸어서 돈가스 속으로" /></h1>
        </div>
        <div className="banner-side">
          <div className="banner-partners" aria-label="돌고돌아 성북천과 카츠헌터 협업">
            <img className="banner-partner-seongbukcheon" src="/seongbukcheon-partner-logo-white.png" alt="돌고돌아 성북천" />
            <img className="banner-partner-cross" src="/partner-cross.png" alt="" aria-hidden="true" width="120" height="120" />
            <div className="banner-partner-hunter">
              <img src="/katsu-hunter-emblem.png" alt="카츠헌터" />
            </div>
          </div>
          <div className="banner-pills" aria-label="행사 콘텐츠">{content.banner.pills.map((pill) => <span key={pill}>{pill}</span>)}</div>
        </div>
      </div>
      <a className="banner-venue" data-browser-ok href={venueHref(bridge.isNative)}
        target={bridge.isNative ? '_self' : '_blank'} rel="noopener noreferrer" aria-label="라운지 돌돌 위치 보기">
        <img className="banner-venue-logo" src="/lounge-doldol-logo.png" alt={content.banner.venue.name} />
        <span><strong>라운지 돌돌</strong> | {content.banner.venue.address}</span>
      </a>
    </section>
    <section className="event-course">
      <div className="section-heading"><h2>{content.mapSection.heading}</h2></div>
      <p className="map-intro-copy">{lines(content.mapSection.intro)}</p>
      <button className="course-preview" aria-label={`${content.mapSection.heading} 보기`} onClick={openMap}>
        <div className="river" />
        <span className="course-pin pin-one"><EventIcon name="pin" size={24} filled /></span>
        <span className="course-pin pin-two"><EventIcon name="pin" size={24} filled /></span>
        <span className="course-pin pin-three"><EventIcon name="pin" size={24} filled /></span>
        <span className="course-label">{content.mapSection.label}</span>
      </button>
      {error && <p role="alert" className="map-editorial-note">{error}</p>}
    </section>
    <StampTourBoard event={event} bridge={bridge} goal={goal} stamp={stamp} nickname={nickname}
      onOpenRanking={() => openPage('ranking')} onOpenStores={() => openPage('stores')}
      onOpenRewards={() => navigation.openDialog({ kind: 'rewards' })} onOpenPolicy={() => navigation.openDialog({ kind: 'policy' })} />
    <EventActivity event={event} bridge={bridge} />
    <EventCalendar heading={content.schedule.heading} period={period?.label}
      onSelect={(item) => navigation.openDialog({ kind: 'schedule', item })} />
    <EventGiftshop event={event} onOpenPage={() => openPage('goods')} onSelect={openGoods} bridge={bridge} />
    {dialogs}
  </>;
}
