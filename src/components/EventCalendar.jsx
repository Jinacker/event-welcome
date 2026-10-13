import React, { useState } from 'react';
import { calendarMonth, kstDate } from '../lib/calendar';
export default function EventCalendar({ event }) {
  const calendar = event.calendar ?? [];
  const [month, setMonth] = useState(() => kstDate().slice(0, 7));
  const model = calendarMonth(month, calendar);
  const shift = (amount) => { const date = new Date(`${month}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + amount); setMonth(date.toISOString().slice(0, 7)); };
  const visible = calendar.filter((item) => item.startDate.slice(0, 7) <= month && item.endDate.slice(0, 7) >= month);
  return <section className="event-calendar" aria-label="성북천 이벤트 캘린더">
    <div className="section-heading"><h2>성북천 이벤트 캘린더</h2></div>
    <div className="calendar-card"><div className="calendar-heading"><button aria-label="이전 달" onClick={() => shift(-1)}>‹</button><strong>{Number(month.slice(0, 4))}년 {Number(month.slice(5))}월</strong><button aria-label="다음 달" onClick={() => shift(1)}>›</button></div>
      <div className="calendar-grid">{['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day} className="weekday">{day}</span>)}
        {model.map((day, index) => day ? <div key={day.date} className={`calendar-day ${day.date === kstDate() ? 'today' : ''} ${day.items.length ? 'scheduled' : ''}`} title={day.items.map((item) => item.title).join(', ')}><span>{day.number}</span>{!!day.items.length && <i />}</div> : <span key={`empty-${index}`} />)}
      </div>
      <div className="calendar-agenda">{visible.length ? visible.map((item) => <div key={item.id}><span>{item.startDate.slice(5).replace('-', '.')} {item.endDate !== item.startDate ? `— ${item.endDate.slice(5).replace('-', '.')}` : ''}</span><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div>) : <p className="section-empty">이번 달 등록된 일정이 없어요.</p>}</div>
    </div>
  </section>;
}
