import React, { useState } from 'react';
import { calendarWeeks, kstDate, scheduledMonths, resolveCalendarMonth } from '../lib/calendar';
export default function EventCalendar({ event }) {
  const calendar = event.calendar ?? [];
  const [selectedMonth, setMonth] = useState(() => kstDate().slice(0, 7));
  const months = scheduledMonths(calendar);
  const month = resolveCalendarMonth(months, selectedMonth);
  const index = months.indexOf(month);
  const previous = index > 0 ? months[index - 1] : null;
  const next = index >= 0 ? months[index + 1] : null;
  const weeks = calendarWeeks(month, calendar);
  const visible = calendar.filter((item) => item.startDate.slice(0, 7) <= month && item.endDate.slice(0, 7) >= month);
  return <section className="event-calendar" aria-label="성북천 이벤트 캘린더">
    <div className="section-heading"><h2>성북천 이벤트 캘린더</h2></div>
    <div className="calendar-card"><div className="calendar-heading"><span style={{ width: 30 }}>{previous && <button aria-label="이전 달" onClick={() => setMonth(previous)}>‹</button>}</span><strong>{Number(month.slice(0, 4))}년 {Number(month.slice(5))}월</strong><span style={{ width: 30 }}>{next && <button aria-label="다음 달" onClick={() => setMonth(next)}>›</button>}</span></div>
      <div className="calendar-grid">{['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day} className="weekday">{day}</span>)}
      </div>
      <div className="calendar-weeks">{weeks.map((week, weekIndex) => <div className="calendar-week" key={weekIndex}>
        <div className="calendar-week-dates">{week.days.map((day, dayIndex) => day
          ? <div key={day.date} className={`calendar-day ${day.date === kstDate() ? 'today' : ''} ${day.items.length ? 'scheduled' : ''}`}><span>{day.number}</span></div>
          : <span key={`empty-${dayIndex}`} />)}</div>
        <div className="calendar-week-events">{week.segments.map(({ item, start, end, lane, continuesBefore, continuesAfter }) =>
          <div key={item.id} className={`calendar-event-bar ${continuesBefore ? 'continues-before' : ''} ${continuesAfter ? 'continues-after' : ''}`}
            style={{ gridColumn: `${start + 1} / ${end + 2}`, gridRow: lane + 1 }} title={`${item.title} · ${item.startDate} ~ ${item.endDate}`}>
            {item.title}
          </div>)}</div>
      </div>)}</div>
      <div className="calendar-agenda">{visible.length ? visible.map((item) => <div key={item.id}><span>{item.startDate.slice(5).replace('-', '.')} {item.endDate !== item.startDate ? `— ${item.endDate.slice(5).replace('-', '.')}` : ''}</span><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div>) : <p className="section-empty">이번 달 등록된 일정이 없어요.</p>}</div>
    </div>
  </section>;
}
