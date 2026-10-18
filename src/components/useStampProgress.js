import { useEventRefresh } from './EventRefreshContext';
import { singleFlight } from '../lib/refresh';
import { useEffect, useRef, useState } from 'react';

// 스탬프 적립 현황을 불러오고 60초·화면 복귀·수동 새로고침마다 갱신한다.
// 스탬프판과 가게별 현황 화면이 같은 값을 쓰도록 이벤트 화면에서 한 번만 호출한다.
export function useStampProgress(event, bridge) {
  const enabled = Boolean(event.stampTour?.enabled);
  const eventRefresh = useEventRefresh();
  const reloadRef = useRef(async () => {});
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    if (!bridge.isNative) return;
    setLoading(true);
    try { await reloadRef.current(); }
    catch { setError('스탬프를 불러오지 못했어요. 다시 시도해주세요.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    setProgress(null);
    if (!enabled) return undefined;
    let cancelled = false;
    const load = singleFlight(async () => {
      if (!bridge.isNative) return;
      try { const result = await bridge.api('/stamps'); if (!cancelled) { setProgress(result); setError(''); } }
      catch (cause) { if (!cancelled) setError('스탬프를 불러오지 못했어요. 다시 시도해주세요.'); throw cause; }
    });
    reloadRef.current = load;
    const unregister = eventRefresh.register(load);
    const reload = () => { load().catch(() => {}); };
    reload();
    const interval = setInterval(reload, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; unregister(); clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [event.id, enabled, bridge, eventRefresh]);
  return { progress, error, loading, refresh };
}
