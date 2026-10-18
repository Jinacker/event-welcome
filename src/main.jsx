import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
// 브리지 isNative와 같은 판정으로, 앱 안에서만 탄성 스크롤 스타일을 켠다.
document.documentElement.dataset.native = window.ReactNativeWebView?.postMessage ? '1' : '0';
createRoot(document.getElementById('root')).render(<App />);
