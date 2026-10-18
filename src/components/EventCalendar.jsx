import React, { useState } from 'react';
import snapshots from '../events/seongbukcheonCalendar.json';
import { scheduleItems } from '../events/seongbukcheonSchedule';

// 독립 HTML의 달력 마크업을 그대로 사용한다. HTML은 빌드에 포함된 고정 자산이다.
export default function EventCalendar({ heading, period, onSelect }) {
  const months = Object.keys(snapshots);
  const [index, setIndex] = useState(0);
  const handleClick = (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const title = button.dataset.calendarEvent;
    if (title) {
      const item = scheduleItems.find((entry) => entry.title === title);
      if (item) onSelect(item);
      return;
    }
    const direction = button.getAttribute('aria-label');
    if (direction === '이전 달') setIndex((value) => Math.max(0, value - 1));
    if (direction === '다음 달') setIndex((value) => Math.min(months.length - 1, value + 1));
  };
  return <section className="event-info" aria-label={heading}>
    <div className="section-heading"><h2>{heading}</h2>{period && <span>{period}</span>}</div>
    <div className="event-schedule" data-browser-ok onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: snapshots[months[index]] }} />
  </section>;
}
