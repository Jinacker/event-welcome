import { useEventRefresh } from './EventRefreshContext';
import { singleFlight } from '../lib/refresh';
import React, { useEffect, useState } from 'react';
import { selectHotFeedCards } from '../lib/hotFeedSelection';

export default function EventActivity({ event, bridge }) {
  const eventRefresh = useEventRefresh();
  const [ranking, setRanking] = useState(null);
  const [feed, setFeed] = useState(null);
  const [errors, setErrors] = useState({});
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [navigationError, setNavigationError] = useState('');
  useEffect(() => {
    let stopped = false;
    const load = singleFlight(async () => {
      if (!bridge.isNative) return;
      const results = await Promise.allSettled([bridge.api('/ranking'), bridge.api('/feed')]);
      if (stopped) return;
      const next = {};
      if (results[0].status === 'fulfilled') setRanking(results[0].value); else next.ranking = '랭킹을 불러오지 못했어요.';
      if (results[1].status === 'fulfilled') { setFeed(selectHotFeedCards(results[1].value.items)); setPage(0); } else next.feed = '피드를 불러오지 못했어요.';
      setErrors(next);
      if (Object.keys(next).length) throw new Error('Event activity refresh failed');
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
  return <section className="event-activity" aria-label="성북천 스탬프 랭킹과 피드">
    <div className="section-heading"><h2>성북천 스탬프 랭킹</h2><span>같은 개수는 공동 순위</span></div>
    <div className="ranking-card">
      {!bridge.isNative ? <p className="section-empty">앱에서 참여자 랭킹과 피드를 만나보세요.</p> : ranking ? <>
        {!ranking.items.length && <p className="section-empty">첫 스탬프의 주인공이 되어보세요!</p>}
        <ol className="ranking-list">{ranking.items.map((item, index) => <li key={`${item.rank}-${index}`} className={item.isMe ? 'is-me' : ''}>
          <span className={`rank-number rank-${item.rank}`}>{item.rank}</span>
          <button className="rank-person" disabled={!item.userId || !item.isProfilePublic || !bridge.isNative} onClick={() => navigate('profile', { userId: item.userId })}>
            {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" /> : <span className="avatar-placeholder">🥩</span>}
            <strong>{item.nickname}{item.isMe && <small>나</small>}</strong>
          </button><span className="rank-count">{item.stampCount}<small>개</small></span>
        </li>)}</ol>
        {ranking.me && !ranking.items.some((item) => item.isMe) && <p className="my-rank">내 순위 {ranking.me.rank}위 · 스탬프 {ranking.me.stampCount}개</p>}
      </> : !errors.ranking && <p className="section-empty" role="status">랭킹을 불러오고 있어요.</p>}
      {errors.ranking && <p role="alert" className="section-empty">{errors.ranking}<button onClick={() => setAttempt((n) => n + 1)}>다시 시도</button></p>}
    </div>
    <div className="section-heading feed-heading"><h2>이번 주 성북천 이야기</h2><span>스탬프를 받은 공개 기록</span></div>
    {bridge.isNative && !feed && !errors.feed && <p className="section-empty" role="status">피드를 불러오고 있어요.</p>}
    {feed?.length === 0 && <p className="section-empty">이번 주 성북천 이야기를 기다리고 있어요.</p>}
    {errors.feed && <p role="alert" className="section-empty">{errors.feed}<button onClick={() => setAttempt((n) => n + 1)}>다시 시도</button></p>}
    <div className="event-hot-feed" onScroll={(e) => {
      const width = e.currentTarget.firstElementChild?.getBoundingClientRect().width;
      if (width) setPage(Math.round(e.currentTarget.scrollLeft / (width + 12)));
    }}>{feed?.map((note) => <button className="hot-feed-card" key={note.id} onClick={() => navigate('note', { noteId: note.id })}>
      <div className="hot-feed-top">{note.photoUrl ? <img className="hot-feed-photo" src={note.photoUrl} alt={`${note.restaurantName} 돈가스`} loading="lazy" /> : <div className="hot-feed-photo placeholder">🥩</div>}
        <div className="hot-feed-copy"><div className="hot-feed-store"><strong>{note.restaurantName}</strong><span>›</span></div><small>{note.area || '성북천'}</small>
          <div className="hot-feed-stars" aria-label={`만족도 ${note.satisfaction}점`}>{'★'.repeat(Math.max(0, Math.min(5, note.satisfaction || 0)))}<span>{Number(note.satisfaction || 0).toFixed(1)}</span></div>
        </div></div>
      <p className="hot-feed-review">{note.review}</p>
      <div className="hot-feed-author">{note.user?.profilePhotoUrl ? <img src={note.user.profilePhotoUrl} alt="" /> : <span>🥩</span>}<span>{note.user?.nickname || '익명'}</span><time>{new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(note.createdAt))}</time></div>
      <div className="hot-feed-stats"><span>♡ {note.likeCount || 0}</span><span>💬 {note.commentCount || 0}</span><span>◉ {note.viewCount || 0}</span><span className="hot-feed-detail">더 보기 ›</span></div>
    </button>)}</div>
    {!!feed?.length && <div className="feed-pagination" aria-label={`피드 ${Math.min(page + 1, feed.length)} / ${feed.length}`}>{feed.map((note, index) => <span key={note.id} className={index === page ? 'active' : ''} />)}</div>}
    {navigationError && <p role="alert">{navigationError}</p>}
  </section>;
}
