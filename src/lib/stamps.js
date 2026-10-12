export function stampSlots(total, earned) {
  const count = Number.isInteger(total) && total >= 0 ? total : 0;
  const filled = Number.isInteger(earned) && earned >= 0 ? earned : 0;
  // 참여 가게가 설정에서 제외되어도 과거에 받은 스탬프는 표시한다.
  return Array.from({ length: Math.min(400, Math.max(count, filled)) }, (_, index) => index < filled);
}
