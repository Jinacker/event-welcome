export function kstDate(date = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date); }
export function calendarMonth(month, items = []) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();
  return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { date, number: i + 1, items: items.filter((item) => item.startDate <= date && item.endDate >= date) };
  })];
}

// 기간 일정이 걸치는 달도 포함하며, 일정이 없는 중간 달은 추가하지 않는다.
export function scheduledMonths(items = []) {
  const months = new Set();
  for (const item of items) {
    const start = item.startDate?.slice(0, 7);
    const end = item.endDate?.slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(start ?? '') || !/^\d{4}-(0[1-9]|1[0-2])$/.test(end ?? '') || start > end) continue;
    const index = (month) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1;
    for (let cursor = index(start); cursor <= index(end); cursor += 1) {
      months.add(`${String(Math.floor(cursor / 12)).padStart(4, '0')}-${String(cursor % 12 + 1).padStart(2, '0')}`);
    }
  }
  return [...months].sort();
}

export function resolveCalendarMonth(months, selected, current = kstDate().slice(0, 7)) {
  if (months.includes(selected)) return selected;
  return months.includes(current) ? current : months[0] ?? current;
}

// 일정을 주 단위 막대로 배치한다. 같은 날짜에 겹치는 막대는 서로 다른 줄을 쓴다.
export function calendarWeeks(month, items = []) {
  const days = calendarMonth(month, items);
  while (days.length % 7) days.push(null);
  const weeks = [];
  for (let offset = 0; offset < days.length; offset += 7) {
    const weekDays = days.slice(offset, offset + 7);
    const dated = weekDays.filter(Boolean);
    const first = dated[0].date;
    const last = dated[dated.length - 1].date;
    const segments = items.filter((item) => item.startDate <= last && item.endDate >= first).map((item) => ({
      item,
      start: weekDays.findIndex((day) => day && day.date >= item.startDate),
      end: weekDays.reduce((end, day, index) => day && day.date <= item.endDate ? index : end, -1),
      continuesBefore: item.startDate < first,
      continuesAfter: item.endDate > last,
    })).sort((a, b) => a.start - b.start || b.end - a.end || a.item.id.localeCompare(b.item.id));
    const lanes = [];
    for (const segment of segments) {
      let lane = lanes.findIndex((end) => end < segment.start);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = segment.end;
      segment.lane = lane;
    }
    weeks.push({ days: weekDays, segments });
  }
  return weeks;
}
