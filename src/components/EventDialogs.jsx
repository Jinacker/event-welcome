import React from 'react';
import EventDialog from './EventDialog';
import GoodsStoreLink from './GoodsStoreLink';
import { dateRangeLabel } from '../lib/period';
import * as content from '../events/seongbukcheonContent';

const lines = (values) => values.map((line, index) => <React.Fragment key={line}>{index ? <br /> : null}{line}</React.Fragment>);

// 이벤트 웹에서 열리는 안내 창들. 일정 상세·럭키드로우 선물·참여 방법·굿즈 사진.
export function ScheduleDialog({ item, native, onClose }) {
  const detail = content.scheduleDetails[item.title];
  const description = detail ? (detail.description ?? (item.description ?? '').trim()) : '';
  return <EventDialog title={item.title} onClose={onClose}>
    <div className="event-dialog-content"><article className="event-dialog-item">
      <p className="event-dialog-date">{dateRangeLabel(item.startDate, item.endDate)}</p>
      {detail?.venue ? <div className="event-dialog-info">
        <p className="event-dialog-venue">{detail.venue}</p>
        {detail.address && <p className="event-dialog-address">{detail.address}</p>}
        {detail.hours && <p className="event-dialog-hours">{detail.hours}</p>}
        {detail.closed && <p className="event-dialog-closed">{detail.closed}</p>}
      </div> : detail?.program ? <div className="event-dialog-info event-program-info">
        <p className="event-program-label">SPECIAL PROGRAM</p>
        <p className="event-dialog-venue">{detail.program}{detail.partner && <>{' with '}
          {/* 앱 웹뷰는 외부 주소를 열지 않으므로 앱에서는 계정만 보여준다. */}
          {native ? <span className="event-partner-handle">{detail.partner}</span>
            : <a className="event-partner-link" href={detail.partnerUrl} target="_blank" rel="noopener noreferrer">{detail.partner}</a>}
        </>}</p>
        {detail.schedule && <p className="event-dialog-hours">{detail.schedule}</p>}
        {detail.programAddress && <p className="event-dialog-address" style={{ marginTop: 8 }}>{detail.programAddress}</p>}
      </div> : <div className="event-dialog-info"><p>{(item.description ?? '').trim() || content.schedulePending}</p></div>}
      {description && <p className="event-program-description">{description}</p>}
      {detail?.gift && <p className="event-program-gift">{detail.gift}</p>}
      {detail?.lists?.map((list) => <section className="event-dialog-list" key={list.heading}>
        <h3>{list.heading}</h3>
        <ul>{list.items.map((entry) => <li key={entry}>{entry}</li>)}</ul>
      </section>)}
    </article></div>
  </EventDialog>;
}

export function RewardsDialog({ onClose }) {
  return <EventDialog title={content.rewards.title} className="reward-dialog" closeLabel="선물 목록 닫기" onClose={onClose}>
    <p className="reward-value">{content.rewards.value}</p>
    <p className="reward-dialog-intro">{content.rewards.intro}<br /><small>{content.rewards.introNote}</small></p>
    <div className="reward-stock-heading">{content.rewards.stockHeading.map((label) => <span key={label}>{label}</span>)}</div>
    <ul className="reward-inventory">{content.rewards.inventory.map((reward) => <li key={reward.name}><span>{reward.name}</span><strong>{reward.stock}</strong></li>)}</ul>
    <div className="reward-dialog-note">{content.rewards.notes.map((note) => <p key={note.text}>{note.heading && <><strong>{note.heading}</strong><br /></>}{note.text}</p>)}</div>
  </EventDialog>;
}

export function PolicyDialog({ goal, stores, period, onClose }) {
  return <EventDialog title={content.policy.title} className="policy-dialog" closeLabel="참여 방법 닫기" onClose={onClose}>
    <div className="stamp-policy">
      <p className="policy-note">{content.policy.notes[0]}<br /><br />{content.policy.notes[1]}</p>
      <h3>{content.policy.heading}</h3>
      <p>{lines(content.policy.summary(stores, goal))}</p>
      <p className="policy-existing">{lines(content.policy.existing)}</p>
      <p className="policy-note">{content.policy.standard}</p>
      <dl>{content.policy.items(goal, period).map((entry) => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.description}</dd></div>)}</dl>
    </div>
  </EventDialog>;
}

export function GoodsDialog({ item, event, note, onClose, bridge }) {
  return <EventDialog title={item.name} className="goods-dialog" closeLabel="상품 사진 닫기" onClose={onClose}>
    {item.imageUrl && <img className="goods-dialog-image" src={item.imageUrl} alt={item.name} />}
    {item.price && <p className="goods-dialog-price">{item.price}</p>}
    {note && <p className="goods-dialog-note">{note}</p>}
    <GoodsStoreLink item={item} event={event} bridge={bridge} />
  </EventDialog>;
}
