import React, { useState } from 'react';
import { calendarWeeks, kstDate, scheduledMonths, resolveCalendarMonth } from '../lib/calendar';
import { dateRangeLabel } from '../lib/period';

// 일정 막대 색. 등록 순서대로 돌려 쓴다.
const PALETTE = [{ backgroundColor: '#1E3C62', color: '#fff' }, { backgroundColor: '#B2DEE8', color: '#1E3C62' }, { backgroundColor: '#DCD8D3', color: '#1E3C62' }];

export default function EventCalendar({ event, heading, period, closure, onSelect }) {
  const calendar = event.calendar ?? [];
  const [selectedMonth, setMonth] = useState(() => kstDate().slice(0, 7));
  const months = scheduledMonths(calendar);
  const month = resolveCalendarMonth(months, selectedMonth);
  const index = months.indexOf(month);
  const previous = index > 0 ? months[index - 1] : null;
  const next = index >= 0 ? months[index + 1] : null;
  const weeks = calendarWeeks(month, calendar);
  const colors = new Map(calendar.map((item, order) => [item.id, PALETTE[order % PALETTE.length]]));
  return <section className="event-info" aria-label={heading}>
    <div className="section-heading"><h2>{heading}</h2>{period && <span>{period}</span>}</div>
    <div className="event-schedule" data-browser-ok>
      <div className="calendar-card"><div className="calendar-heading"><span style={{ width: 30 }}>{previous && <button aria-label="이전 달" onClick={() => setMonth(previous)}>‹</button>}</span><strong>{Number(month.slice(0, 4))}년 {Number(month.slice(5))}월</strong><span style={{ width: 30 }}>{next && <button aria-label="다음 달" onClick={() => setMonth(next)}>›</button>}</span></div>
        <div className="calendar-grid">{['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day} className="weekday">{day}</span>)}
        </div>
        <div className="calendar-weeks">{weeks.map((week, weekIndex) => <div className="calendar-week" key={weekIndex}>
          <div className="calendar-week-dates">{week.days.map((day, dayIndex) => day
            ? <div key={day.date} title={closure && day.items.length && dayIndex === closure.weekday ? closure.title : undefined}
              className={`calendar-day ${day.date === kstDate() ? 'today' : ''} ${day.items.length ? 'scheduled' : ''} ${closure && day.items.length && dayIndex === closure.weekday ? 'lounge-closed' : ''}`.replace(/\s+/g, ' ').trim()}><span>{day.number}</span></div>
            : <span key={`empty-${dayIndex}`} />)}</div>
          <div className="calendar-week-events">
            {closure && week.days.map((day, dayIndex) => day && day.items.length && dayIndex === closure.weekday
              // 휴무 표시는 그날을 덮는 일정 막대 아래 줄에 둔다.
              ? <span key={`closure-${day.date}`} className="calendar-closure" style={{ gridColumn: dayIndex + 1, gridRow: week.segments.reduce((lanes, segment) => segment.start <= dayIndex && segment.end >= dayIndex ? Math.max(lanes, segment.lane + 1) : lanes, 0) + 1 }}>{closure.label}</span>
              : null)}
            {week.segments.map(({ item, start, end, lane, continuesBefore, continuesAfter }) => {
              const label = `${item.title} · ${dateRangeLabel(item.startDate, item.endDate)}`;
              return <button key={item.id} type="button" title={label} aria-label={label} onClick={onSelect ? () => onSelect(item) : undefined}
                className={`calendar-event-bar ${continuesBefore ? 'continues-before' : ''} ${continuesAfter ? 'continues-after' : ''}`.replace(/\s+/g, ' ').trim()}
                style={{ ...colors.get(item.id), gridColumn: `${start + 1} / ${end + 2}`, gridRow: lane + 1 }}>
                {item.title}<span className="calendar-bar-sr">{dateRangeLabel(item.startDate, item.endDate)}</span>
              </button>;
            })}
          </div>
        </div>)}</div>
      </div>
    </div>
  </section>;
}
