import React, { useEffect, useMemo, useState } from 'react';
import { createEventBridge } from './bridge/client';
import { APP_HOME_LINK, appEventLink, inactiveRedirect, loadBrowserEvent } from './lib/events';
import { eventPages } from './events';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'https://katsu-map-api-181871710999.asia-northeast3.run.app').replace(/\/$/, '');
export default function App() {
  const bridge = useMemo(() => createEventBridge(), []);
  const [event, setEvent] = useState(null);
  const [context, setContext] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const native = bridge.isNative;
  const openHome = () => {
    if (native) bridge.navigate('home').catch(() => { window.location.href = APP_HOME_LINK; });
    else window.location.href = APP_HOME_LINK;
  };
  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        if (native) { const value = await bridge.getContext(); if (!stopped) { setContext(value); setEvent(value.event); setError(''); } }
        else { const value = await loadBrowserEvent(window.location, API_ORIGIN); if (!stopped) { setEvent(value); setError(''); } }
      } catch (cause) { if (!stopped) setError(cause.message); }
    };
    setError(''); load();
    const refresh = async () => {
      if (document.hidden) return;
      if (!native) { load(); return; }
      try { const value = await bridge.api('/context'); if (!stopped) setEvent(value.event); }
      catch (cause) { if (!stopped && cause.code === '410') setEvent((current) => current ? { ...current, enabled: false } : current); }
    };
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [bridge, native, attempt]);
  useEffect(() => () => bridge.dispose(), [bridge]);
  useEffect(() => {
    if (event?.enabled !== false) return undefined;
    return inactiveRedirect({ openHome });
  }, [event?.enabled]);
  useEffect(() => {
    if (native || !event?.enabled || !/^\/event\//.test(window.location.pathname)) return undefined;
    const timer = setTimeout(() => { window.location.href = appEventLink(event.id, window.location.search); }, 200);
    return () => clearTimeout(timer);
  }, [event?.id, event?.enabled, native]);

  if (error) return <main className="status-page"><span className="status-mark">🥩</span><h1>잠시만 기다려주세요</h1><p role="alert">{error}</p><button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button><a href={APP_HOME_LINK} onClick={native ? (e) => { e.preventDefault(); openHome(); } : undefined}>돈가스 지도 열기</a></main>;
  if (!event) return <main className="status-page" role="status"><span className="status-mark">🥩</span><p>이벤트를 불러오고 있어요.</p></main>;
  if (!event.enabled) return <main className="status-page"><span className="status-mark">🥩</span><h1>현재 이벤트 비활성화입니다</h1><p>잠시 후 돈가스 지도로 이동합니다.</p><a href={APP_HOME_LINK} onClick={native ? (e) => { e.preventDefault(); openHome(); } : undefined}>돈가스 지도 열기</a></main>;
  const Page = eventPages[event.webPath];
  const nickname = typeof context?.user?.nickname === 'string' ? context.user.nickname.trim() : '';
  return <main className="event-page"><header className="page-header"><span>{nickname ? `${nickname}님 환영이에요!` : '환영해요!'}</span></header>
    {Page ? <Page event={event} context={context} bridge={bridge} /> : <section className="intro-card"><h1>{event.title}</h1><p>이벤트 안내를 준비하고 있어요.</p></section>}
    {!native && <a className="app-button" href={appEventLink(event.id, window.location.search)}>돈가스 지도에서 이벤트 열기</a>}<footer>맛있는 발견, 돈가스 지도</footer>
  </main>;
}
