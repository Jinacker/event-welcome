import EventIcon from './EventIcon';
import { formatRelativeTime } from '../lib/relativeTime';
import { useEventRefresh } from './EventRefreshContext';
import { singleFlight } from '../lib/refresh';
import React, { useEffect, useState } from 'react';
import { selectHotFeedCards } from '../lib/hotFeedSelection';
import { activity } from '../events/seongbukcheonContent';

export default function EventActivity({ event, bridge }) {
  const eventRefresh = useEventRefresh();
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [navigationError, setNavigationError] = useState('');
  useEffect(() => {
    let stopped = false;
    const load = singleFlight(async () => {
      if (!bridge.isNative) return;
      try { const result = await bridge.api('/feed'); if (!stopped) { setFeed(selectHotFeedCards(result.items)); setPage(0); setError(''); } }
      catch (cause) { if (!stopped) setError('피드를 불러오지 못했어요.'); throw cause; }
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
  return <section className="event-activity" aria-label={activity.heading}>
    <div className="section-heading feed-heading"><h2>{activity.heading}</h2></div>
    {!bridge.isNative && <button type="button" className="section-empty app-feature-link">돈가스 지도에서 성북천 이야기 보기 ›</button>}
    {bridge.isNative && !feed && !error && <p className="section-empty" role="status">피드를 불러오고 있어요.</p>}
    {feed?.length === 0 && <p className="section-empty">이번 주 성북천 이야기를 기다리고 있어요.</p>}
    {error && <p role="alert" className="section-empty">{error}<button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p>}
    <div className="event-hot-feed" onScroll={(e) => {
      const width = e.currentTarget.firstElementChild?.getBoundingClientRect().width;
      if (width) setPage(Math.round(e.currentTarget.scrollLeft / (width + 12)));
    }}>{feed?.map((note) => <button className="hot-feed-card" key={note.id} onClick={() => navigate('note', { noteId: note.id })}>
      <div className="hot-feed-top">
        {note.photoUrl ? <img className="hot-feed-photo" src={note.photoUrl} alt={`${note.restaurantName} 돈가스`} loading="lazy" /> : <div className="hot-feed-photo placeholder"><EventIcon name="pin" size={28} /></div>}
        <div className="hot-feed-copy">
          <div className="hot-feed-store"><div><strong>{note.restaurantName}</strong>{note.area && <small>{note.area}</small>}</div><EventIcon name="chevron" size={18} /></div>
          <div className="hot-feed-stars" aria-label={`만족도 ${note.satisfaction}점`}>
            {[1, 2, 3, 4, 5].map((star) => <EventIcon key={star} name="star" size={13} filled={star <= Number(note.satisfaction || 0)} />)}
            <span>{Number(note.satisfaction || 0).toFixed(1)}</span>
          </div>
          <p className="hot-feed-review">{note.review?.trim() || '남겨진 후기를 확인해보세요.'}</p>
          <div className="hot-feed-footer">
            <div className="hot-feed-author">{note.user?.profilePhotoUrl ? <img src={note.user.profilePhotoUrl} alt="" /> : <span className="hot-feed-avatar"><EventIcon name="user" size={12} filled /></span>}
              <span className="hot-feed-username">{note.user?.nickname || '익명'}</span><time>{formatRelativeTime(note.createdAt)}</time>
            </div>
            <div className="hot-feed-stats"><span aria-label={`좋아요 ${note.likeCount || 0}개`}><EventIcon name="heart" size={12} filled />{note.likeCount || 0}</span><span aria-label={`댓글 ${note.commentCount || 0}개`}><EventIcon name="chat" size={12} />{note.commentCount || 0}</span></div>
          </div>
        </div>
      </div>
    </button>)}</div>
    {!!feed?.length && <div className="feed-pagination" aria-label={`피드 ${Math.min(page + 1, feed.length)} / ${feed.length}`}>{feed.map((note, index) => <span key={note.id} className={index === page ? 'active' : ''} />)}</div>}
    {navigationError && <p role="alert">{navigationError}</p>}
  </section>;
}
