const WEEK_OPEN = '<div class="calendar-week">';
const WEEK_EVENTS = '<div class="calendar-week-events">';
const BLOCK_CLOSE = '</div></div>';

const pad = (value) => String(value).padStart(2, '0');

const monthOf = (label) => {
  const matched = /(\d{4})년\s*(\d{1,2})월/.exec(typeof label === 'string' ? label : '');
  return matched ? { year: matched[1], month: pad(matched[2]) } : null;
};

// 이 달에서 행사 기간과 겹치는 날짜 구간. 겹치지 않으면 null.
function dayRange(month, period) {
  const start = period.startDate > `${month.year}-${month.month}-01` ? period.startDate : `${month.year}-${month.month}-01`;
  const end = period.endDate < `${month.year}-${month.month}-31` ? period.endDate : `${month.year}-${month.month}-31`;
  if (start.slice(0, 7) !== `${month.year}-${month.month}` || end.slice(0, 7) !== `${month.year}-${month.month}` || start > end) return null;
  return [Number(start.slice(8)), Number(end.slice(8))];
}

const weekDays = (week) => [...week.split(WEEK_EVENTS)[0].matchAll(/<span>(\d{1,2})<\/span>/g)].map((matched) => Number(matched[1]));

// 월 이동 버튼은 달을 세로로 이어 붙여 보여주므로 쓰지 않는다.
const stripMonthNav = (html) => html.replace(/<button type="button" aria-label="(?:이전|다음) 달">[\s\S]*?<\/button>/g, '');

// 달력 스냅샷에서 행사 기간에 걸치는 주만 남긴다. 기간을 모르면 원본을 그대로 쓴다.
export function trimCalendarMonth(html, label, period) {
  if (typeof html !== 'string' || !html) return '';
  const clean = stripMonthNav(html);
  const month = monthOf(label);
  if (!month || !period?.startDate || !period?.endDate) return clean;
  const range = dayRange(month, period);
  if (!range) return '';
  const parts = clean.split(WEEK_OPEN);
  const weeks = parts.slice(1);
  if (!weeks.length) return clean;
  const last = weeks.length - 1;
  let tail = '';
  // 마지막 주 뒤에는 주 목록과 카드를 닫는 태그가 붙어 있어 따로 떼어 둔다.
  if (weeks[last].endsWith(BLOCK_CLOSE + BLOCK_CLOSE)) {
    tail = BLOCK_CLOSE;
    weeks[last] = weeks[last].slice(0, -BLOCK_CLOSE.length);
  }
  const kept = weeks.filter((week) => weekDays(week).some((day) => day >= range[0] && day <= range[1]));
  if (!kept.length) return clean;
  return parts[0] + kept.map((week) => WEEK_OPEN + week).join('') + tail;
}

// 장식 스티커를 지정한 주 안에 첫 자식으로 끼워 넣는다. 음수는 뒤에서부터 센다.
export function withWeekSticker(html, weekIndex, markup) {
  if (typeof html !== 'string' || !markup) return html;
  const parts = html.split(WEEK_OPEN);
  const total = parts.length - 1;
  const target = weekIndex < 0 ? total + weekIndex : weekIndex;
  if (target < 0 || target >= total) return html;
  parts[target + 1] = markup + parts[target + 1];
  return parts.join(WEEK_OPEN);
}

// 스냅샷 전체를 기간에 맞춰 손질한다. 빈 달은 빼고 순서는 그대로 둔다.
export function calendarMonths(snapshots, period) {
  const source = snapshots && typeof snapshots === 'object' ? snapshots : {};
  return Object.keys(source)
    .map((label) => ({ label, html: trimCalendarMonth(source[label], label, period) }))
    .filter((month) => month.html);
}
