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
    <div className="section-heading stamp-ranking-heading"><h2 className="stamp-ranking-title">{rankingPage.title}
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M7 2h10v3h4v3a5 5 0 0 1-5 5h-.1a5 5 0 0 1-2.9 1.9V20h4v2H7v-2h4v-5.1A5 5 0 0 1 8.1 13H8a5 5 0 0 1-5-5V5h4V2Zm0 5H5v1a3 3 0 0 0 2.1 2.9A5 5 0 0 1 7 10V7Zm10 0v3c0 .3 0 .6-.1.9A3 3 0 0 0 19 8V7h-2Z" />
      </svg>
    </h2></div>
    {ranking?.items?.length > 0 && <div className="stamp-ranking-podium" aria-label="스탬프 랭킹 시상대">
      {[2, 1, 3].map((rank) => {
        const winners = ranking.items.filter((item) => item.rank === rank);
        return <div key={rank} className={`stamp-podium-column stamp-podium-place-${rank}`}>
          <div className="stamp-podium-winners">
            <span className="stamp-podium-medal" role="img" aria-label={`${rank}위`}>{['🥇', '🥈', '🥉'][rank - 1]}</span>
            {winners.length ? winners.map((item, index) => <strong key={item.userId ?? index} className="stamp-podium-name">{item.nickname}</strong>)
              : <span className="stamp-podium-empty">—</span>}
          </div>
          <div className="stamp-podium-step" aria-hidden="true" />
        </div>;
      })}
    </div>}
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
