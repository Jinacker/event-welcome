export const PULL_REFRESH_THRESHOLD = 60;

export function pullRefreshDistance(start, touch, scrollTop = 0, touchCount = 1) {
  if (!start || touchCount !== 1 || scrollTop > 0) return 0;
  const x = touch.clientX - start.clientX;
  const y = touch.clientY - start.clientY;
  if (y <= 0 || Math.abs(x) > y) return 0;
  return Math.min(90, y * 0.5);
}

export function singleFlight(task) {
  let pending;
  return (...args) => {
    if (!pending) pending = Promise.resolve().then(() => task(...args)).finally(() => { pending = undefined; });
    return pending;
  };
}

export function createEventRefresh() {
  const tasks = new Set();
  return {
    register(task) { tasks.add(task); return () => tasks.delete(task); },
    run: singleFlight(async () => {
      const results = await Promise.allSettled([...tasks].map((task) => Promise.resolve().then(task)));
      if (results.some((result) => result.status === 'rejected')) throw new Error('일부 정보를 새로 불러오지 못했어요. 다시 시도해주세요.');
    }),
  };
}
