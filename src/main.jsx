import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
// 브리지 isNative와 같은 판정으로, 앱 안에서만 탄성 스크롤 스타일을 켠다.
document.documentElement.dataset.native = window.ReactNativeWebView?.postMessage ? '1' : '0';
// 이미지·링크 드래그를 막되 입력 영역의 텍스트 편집은 유지한다.
document.addEventListener('dragstart', (event) => {
  const target = event.target;
  if (target instanceof Element && (target.closest('input, textarea') || target.isContentEditable)) return;
  event.preventDefault();
});
createRoot(document.getElementById('root')).render(<App />);
