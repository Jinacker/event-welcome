import React, { useEffect, useState } from 'react';
import { loadGoodsStoreDestination } from '../lib/goodsNavigation';

// 앱이 연 외부 브라우저에서만 실행한다. 공개 설정에 등록된 https 상품 URL로 이동한다.
export default function GoodsRedirectPage() {
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let stopped = false;
    setError('');
    loadGoodsStoreDestination(window.location).then((url) => {
      if (!stopped) window.location.replace(url);
    }).catch((cause) => { if (!stopped) setError(cause.message); });
    return () => { stopped = true; };
  }, [attempt]);
  return <main className="status-page">
    {error ? <>
      <h1>상품 링크를 열지 못했어요</h1><p role="alert">{error}</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>다시 시도</button>
      <a href="/">이벤트로 돌아가기</a>
    </> : <><span className="status-spinner" aria-hidden="true" /><p role="status">스토어로 이동하고 있어요.</p></>}
  </main>;
}
