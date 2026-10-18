import React from 'react';
import { stampBoard } from '../lib/stamps';
import { appStoreUrl } from '../lib/events';
import { stampSection } from '../events/seongbukcheonContent';

// 도장이 똑같이 찍히지 않도록 칸마다 기울기를 조금씩 다르게 준다.
const ANGLES = [-7, -4, -10, -6, -9, -3, -8, -5, -11, -6];

export default function StampTourBoard({ event, bridge, goal, stamp, nickname, onOpenRanking, onOpenStores, onOpenRewards, onOpenPolicy }) {
  const tour = event.stampTour;
  if (!tour?.enabled) return null;
  const { progress, error, loading, refresh } = stamp;
  const earned = progress?.earned ?? 0;
  const board = stampBoard(goal, earned, stampSection.milestones);
  const total = Math.max(1, board.length);
  const remaining = Math.max(0, board.length - earned);
  const slot = ({ index, filled }) => <div key={index} className={`stamp-slot ${filled ? 'filled' : ''}`.trim()}
    aria-label={`${index + 1}번째 ${filled ? '획득' : '빈'} 스탬프`} style={filled ? { '--stamp-angle': `${ANGLES[index % ANGLES.length]}deg` } : undefined}>
    {filled
      ? <span className="earned-stamp-mark" role="img" aria-label={`${stampSection.mark.join(' ')} 도장`}>{stampSection.mark.map((line) => <span key={line}>{line}</span>)}</span>
      : <span>{index + 1}</span>}
  </div>;
  return <section className="stamp-tour" aria-label="스탬프 투어" data-browser-ok>
    <div className="stamp-tour-heading">
      <h2>{nickname ? `${nickname}님의 스탬프` : '내 스탬프'}</h2>
      <button type="button" className="stamp-ranking-link" onClick={onOpenRanking}>랭킹</button>
    </div>
    <div className="stamp-reward-intro">
      <h3>{stampSection.rewardTitle}</h3>
      <p className="stamp-prize-copy">{stampSection.prize}</p>
      <p>{stampSection.guide(board.length)}</p>
    </div>
    <div className="stamp-summary">
      <div><p>현재 모은 스탬프</p><strong>{progress ? earned : '—'} <small>/ {board.length}</small></strong></div>
      <button type="button" className="stamp-remaining-button" onClick={onOpenStores}
        aria-label={progress ? `완주까지 ${remaining}곳, 가게별 스탬프 획득 현황 보기` : '가게별 스탬프 획득 현황 보기'}>
        {progress ? (remaining ? `완주까지 ${remaining}곳` : '완주 완료!') : '가게별 현황'}
      </button>
    </div>
    <div className="stamp-progress" role="progressbar" aria-label="스탬프 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earned}>
      <span style={{ width: `${Math.min(100, earned / total * 100)}%` }} />
    </div>
    {!bridge.isNative && <a className="app-button" href={appStoreUrl(window.navigator)}>앱에서 내 스탬프 보기</a>}
    {bridge.isNative && !progress && !error && <p role="status">스탬프를 불러오는 중...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={refresh} disabled={loading}>다시 시도</button></div>}
    <div className="stamp-grid" aria-label={`스탬프 ${earned}개`}>
      {board.map((item) => item.label
        ? <div className="stamp-milestone" key={item.index}>{slot(item)}<small>{item.label}</small></div>
        : slot(item))}
    </div>
    <p className="stamp-early-note">{stampSection.earlyNote}</p>
    <div className="stamp-secondary-actions">
      <button type="button" onClick={onOpenRewards}>선물 안내</button>
      <button type="button" onClick={onOpenPolicy}>참여 방법</button>
    </div>
  </section>;
}
