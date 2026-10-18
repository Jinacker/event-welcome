export function stampSlots(total, earned) {
  const count = Number.isInteger(total) && total >= 0 ? total : 0;
  const filled = Number.isInteger(earned) && earned >= 0 ? earned : 0;
  // 참여 가게가 설정에서 제외되어도 과거에 받은 스탬프는 표시한다.
  return Array.from({ length: Math.min(400, Math.max(count, filled)) }, (_, index) => index < filled);
}

// 완주 목표 칸 수. 관리자가 추가 웹 설정에 stampGoal을 적지 않으면 참여 가게 수를 쓴다.
export function stampGoal(event) {
  const raw = Number(event?.publicData?.stampGoal);
  const restaurants = Array.isArray(event?.stampTour?.restaurants) ? event.stampTour.restaurants.length : 0;
  return Number.isInteger(raw) && raw > 0 && raw <= 400 ? raw : restaurants;
}

// 스탬프판 한 칸씩의 상태와 보상 안내 문구(마일스톤)를 함께 돌려준다.
export function stampBoard(goal, earned, milestones) {
  const labels = milestones && typeof milestones === 'object' ? milestones : {};
  return stampSlots(goal, earned).map((filled, index) => ({ index, filled, label: typeof labels[index + 1] === 'string' ? labels[index + 1] : '' }));
}
