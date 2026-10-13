export function kstDate(date = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date); }
export function calendarMonth(month, items = []) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();
  return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { date, number: i + 1, items: items.filter((item) => item.startDate <= date && item.endDate >= date) };
  })];
}
