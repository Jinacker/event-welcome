// 작성 시각 기준 상대 시간: 1시간 이내 방금 전 / n시간 전 / 어제 / n일 전 / 10일 이상 MM.DD
// (커뮤니티 피드 카드의 시간 표기와 같은 규칙)
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 60) return '방금 전';

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDay = Math.round((startToday - startThatDay) / 86400000);
  if (diffDay <= 1) return '어제';
  if (diffDay < 10) return `${diffDay}일 전`;

  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
