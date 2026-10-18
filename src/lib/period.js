const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function periodLabel(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split('-');
  const [endYear, endMonth, endDay] = endDate.split('-');
  const start = `${startYear}.${startMonth}.${startDay}`;
  if (startDate === endDate) return start;
  if (startYear !== endYear) return `${start}–${endYear}.${endMonth}.${endDay}`;
  if (startMonth !== endMonth) return `${start}–${endMonth}.${endDay}`;
  return `${start}–${endDay}`;
}

// 관리자가 등록한 일정 전체를 감싸는 기간. 일정이 없으면 기간을 표시하지 않는다.
export function calendarPeriod(calendar) {
  const items = (Array.isArray(calendar) ? calendar : []).filter((item) => isDate(item?.startDate) && isDate(item?.endDate));
  if (!items.length) return null;
  const startDate = items.reduce((min, item) => item.startDate < min ? item.startDate : min, items[0].startDate);
  const endDate = items.reduce((max, item) => item.endDate > max ? item.endDate : max, items[0].endDate);
  return { startDate, endDate, label: periodLabel(startDate, endDate) };
}

export function monthDayLabel(date) {
  const [, month, day] = date.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

export function dateRangeLabel(startDate, endDate) {
  if (!isDate(startDate) || !isDate(endDate)) return '';
  return startDate === endDate ? monthDayLabel(startDate) : `${monthDayLabel(startDate)} – ${monthDayLabel(endDate)}`;
}

// '2026년 10월 20일–11월 8일' 형태. 안내 문구 안에 넣는 긴 표기.
export function longPeriodLabel(startDate, endDate) {
  if (!isDate(startDate) || !isDate(endDate)) return '';
  const year = startDate.slice(0, 4);
  return startDate === endDate ? `${year}년 ${monthDayLabel(startDate)}` : `${year}년 ${monthDayLabel(startDate)}–${monthDayLabel(endDate)}`;
}
