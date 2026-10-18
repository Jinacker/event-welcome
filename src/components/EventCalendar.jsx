import React, { useMemo } from 'react';
import snapshots from '../events/seongbukcheonCalendar.json';
import { scheduleItems } from '../events/seongbukcheonSchedule';
import { calendarMonths, withWeekSticker } from '../lib/calendarSnapshot';
import { calendarPeriod } from '../lib/period';

// 달력 빈칸에 얹는 장식 그림. 클릭과 낭독 대상이 아니다.
const sticker = (name) => `<img class="calendar-sticker sticker-${name}" src="/calendar-sticker-${name}.png" alt="" aria-hidden="true">`;

// 첫 달 첫 주 왼쪽에 컵, 마지막 달 마지막 주에 산도를 둔다.
function decorate(html, index, last) {
  let marked = html;
  if (index === 0) marked = withWeekSticker(marked, 0, sticker('glass'));
  if (index === last) marked = withWeekSticker(marked, -1, sticker('sando'));
  return marked;
}

// 독립 HTML의 달력 마크업을 그대로 사용한다. HTML은 빌드에 포함된 고정 자산이다.
export default function EventCalendar({ heading, period, onSelect }) {
  // 행사 기간에 걸치는 주만 남겨 달을 세로로 이어 붙인다.
  const months = useMemo(() => calendarMonths(snapshots, calendarPeriod(scheduleItems)), []);
  const handleClick = (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const item = scheduleItems.find((entry) => entry.title === button.dataset.calendarEvent);
    if (item) onSelect(item);
  };
  return <section className="event-info" aria-label={heading}>
    <div className="section-heading"><h2>{heading}</h2>{period && <span>{period}</span>}</div>
    <div className="event-schedule" data-browser-ok onClick={handleClick}>
      {months.map((month, index) => <div className="calendar-month" key={month.label}>
        <div dangerouslySetInnerHTML={{ __html: decorate(month.html, index, months.length - 1) }} />
        {index > 0 && <img className="calendar-sticker sticker-taco" src="/calendar-sticker-taco.png" alt="" aria-hidden="true" />}
      </div>)}
    </div>
  </section>;
}
