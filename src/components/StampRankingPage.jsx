import EventIcon from './EventIcon';
import { useEventRefresh } from './EventRefreshContext';
import { singleFlight } from '../lib/refresh';
import React, { useEffect, useState } from 'react';
import { rankingPage } from '../events/seongbukcheonContent';

export default function StampRankingPage({ event, bridge }) {
  const eventRefresh = useEventRefresh();
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [navigationError, setNavigationError] = useState('');
  useEffect(() => {
    let stopped = false;
    const load = singleFlight(async () => {
      if (!bridge.isNative) return;
      try { const result = await bridge.api('/ranking'); if (!stopped) { setRanking(result); setError(''); } }
      catch (cause) { if (!stopped) setError('랭킹을 불러오지 못했어요.'); throw cause; }
    });
    const unregister = eventRefresh.register(load);
    const reload = () => { load().catch(() => {}); };
    reload();
    const timer = setInterval(reload, 60000);
    const visible = () => { if (!document.hidden) reload(); };
    document.addEventListener('visibilitychange', visible);
    return () => { stopped = true; unregister(); clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [event.id, bridge, attempt, eventRefresh]);
  const navigate = (target, params) => bridge.navigate(target, params).catch(() => setNavigationError('화면을 열지 못했어요. 다시 시도해주세요.'));
  return <section className="ranking-page" aria-label="스탬프 랭킹 화면" data-browser-ok>
    <header className="ranking-page-header">
      <strong>{rankingPage.title}</strong>
    </header>
    <div className="section-heading"><h2>{rankingPage.heading}</h2><span>{rankingPage.note}</span></div>
    <div className="ranking-card">
      {!bridge.isNative ? <p className="section-empty">앱에서 참여자 랭킹을 만나보세요.</p> : ranking ? <>
        {!ranking.items.length && <p className="section-empty">첫 스탬프의 주인공이 되어보세요!</p>}
        <ol className="ranking-list">{ranking.items.map((item, index) => <li key={`${item.rank}-${index}`} className={item.isMe ? 'is-me' : ''}>
          <span className={`rank-number rank-${item.rank}`}>{item.rank}</span>
          <button className="rank-person" disabled={!item.userId || !item.isProfilePublic} onClick={() => navigate('profile', { userId: item.userId })}>
            {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" /> : <span className="avatar-placeholder"><EventIcon name="user" size={17} filled /></span>}
            <strong>{item.nickname}{item.isMe && <small>나</small>}</strong>
          </button><span className="rank-count">{item.stampCount}<small>개</small></span>
        </li>)}</ol>
        {ranking.me && !ranking.items.some((item) => item.isMe) && <p className="my-rank">내 순위 {ranking.me.rank}위 · 스탬프 {ranking.me.stampCount}개</p>}
      </> : !error && <p className="section-empty" role="status">랭킹을 불러오고 있어요.</p>}
      {error && <p role="alert" className="section-empty">{error}<button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p>}
    </div>
    {navigationError && <p role="alert">{navigationError}</p>}
  </section>;
}
