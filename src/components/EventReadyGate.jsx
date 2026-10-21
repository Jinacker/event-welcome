import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

const InitialLoadContext = createContext(null);

// 데이터가 실제 DOM에 반영된 뒤 대기를 해제해 피드 사진과 도장도 함께 준비한다.
export function useEventInitialLoad(loading) {
  const register = useContext(InitialLoadContext);
  useLayoutEffect(() => {
    if (loading && register) return register();
    return undefined;
  }, [loading, register]);
}

function prepareImage(image) {
  image.loading = 'eager';
  if (typeof image.decode === 'function') return image.decode();
  if (image.complete) return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error('IMAGE_FAILED'));
  return new Promise((resolve, reject) => {
    const cleanup = () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('IMAGE_FAILED')); };
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
  });
}

export default function EventReadyGate({ children, onRetry }) {
  const content = useRef(null);
  const pending = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const register = useCallback(() => {
    pending.current += 1;
    setPendingCount(pending.current);
    return () => { pending.current -= 1; setPendingCount(pending.current); };
  }, []);

  useEffect(() => {
    if (ready || error) return undefined;
    const timer = setTimeout(() => setError('화면 준비가 지연되고 있어요. 다시 시도해주세요.'), 45000);
    return () => clearTimeout(timer);
  }, [ready, error]);

  useEffect(() => {
    if (ready || error || pending.current > 0) return undefined;
    let cancelled = false;
    let frame;
    const images = [...content.current.querySelectorAll('img')].filter((image) => image.getAttribute('src') || image.getAttribute('srcset'));
    const fonts = document.fonts
      ? Promise.all([document.fonts.load('800 16px "Event Pretendard ExtraBold"'), document.fonts.ready])
      : Promise.resolve();
    Promise.all([fonts, ...images.map(prepareImage)]).then(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() => { if (!cancelled) setReady(true); });
    }).catch(() => {
      if (!cancelled) setError('화면에 필요한 이미지를 불러오지 못했어요. 다시 시도해주세요.');
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [pendingCount, ready, error]);

  return <InitialLoadContext.Provider value={register}>
    {!ready && <main className="status-page" role={error ? undefined : 'status'}>
      {error ? <><p role="alert">{error}</p><button type="button" onClick={onRetry}>다시 시도</button></>
        : <><span className="status-spinner" aria-hidden="true" /><p>이벤트를 불러오고 있어요.</p></>}
    </main>}
    <div ref={content} className="event-initial-content" aria-hidden={ready ? undefined : true}>{children}</div>
  </InitialLoadContext.Provider>;
}
