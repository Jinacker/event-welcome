import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
// 브리지 isNative와 같은 판정으로, 앱 안에서만 탄성 스크롤 스타일을 켠다.
document.documentElement.dataset.native = window.ReactNativeWebView?.postMessage ? '1' : '0';
// Safari/WebView의 확대 제스처도 막고 한 손가락 스크롤은 유지한다.
for (const type of ['gesturestart', 'gesturechange']) {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
}
// 이미지·링크 드래그를 막되 입력 영역의 텍스트 편집은 유지한다.
document.addEventListener('dragstart', (event) => {
  const target = event.target;
  if (target instanceof Element && (target.closest('input, textarea') || target.isContentEditable)) return;
  event.preventDefault();
});
createRoot(document.getElementById('root')).render(<App />);
