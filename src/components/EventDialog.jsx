import React, { useLayoutEffect, useRef } from 'react';

// 이벤트 웹 공용 모달. 바깥쪽을 누르거나 Escape를 누르면 닫힌다.
export default function EventDialog({ title, className = '', closeLabel = '팝업 닫기', onClose, children }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  // 열고 닫는 효과는 한 번만 실행한다. 부모가 다시 그릴 때 모달이 닫히지 않게 onClose는 ref로 쓴다.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const saved = [];
    const lock = (element, styles) => {
      for (const [property, value] of Object.entries(styles)) {
        saved.push([element, property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
        element.style.setProperty(property, value);
      }
    };
    // iOS WebView에서도 짧은 팝업의 터치가 배경 스크롤로 이어지지 않게 고정한다.
    lock(document.documentElement, { overflow: 'hidden', 'overscroll-behavior': 'none' });
    lock(document.body, { position: 'fixed', top: `${-scrollY}px`, left: `${-scrollX}px`, width: '100%', overflow: 'hidden' });
    // showModal을 지원하지 않는 구버전 웹뷰에서도 보이도록 open 속성을 직접 켠다.
    if (!dialog.open) { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); }
    const cancel = (action) => { action.preventDefault(); close.current(); };
    dialog.addEventListener('cancel', cancel);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      for (const [element, property, value, priority] of saved) {
        if (value) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      }
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    };
  }, []);
  const backdrop = (action) => {
    const dialog = ref.current;
    if (!dialog || action.target !== dialog) return;
    const area = dialog.getBoundingClientRect();
    if (action.clientX < area.left || action.clientX > area.right || action.clientY < area.top || action.clientY > area.bottom) onClose();
  };
  return <dialog ref={ref} className={`event-date-dialog ${className}`.trim()} data-browser-ok aria-label={title} onClick={backdrop}>
    <div className="event-dialog-header"><h2>{title}</h2><button type="button" aria-label={closeLabel} onClick={onClose}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button></div>
    {children}
  </dialog>;
}
