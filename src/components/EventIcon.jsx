import React from 'react';
const paths = {
  back: 'M15 5l-7 7 7 7',
  pencil: 'm16 3 5 5-13 13H3v-5L16 3z M14 5l5 5',
  // Material Design Icons arrow-u-left-top: 앱 MapScreen의 뒤로가기 아이콘과 동일.
  undo: 'M20 13.5C20 17.09 17.09 20 13.5 20H6V18H13.5C16 18 18 16 18 13.5S16 9 13.5 9H7.83L10.91 12.09L9.5 13.5L4 8L9.5 2.5L10.92 3.91L7.83 7H13.5C17.09 7 20 9.91 20 13.5Z',
  chevron: 'M9 5l7 7-7 7',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  chat: 'M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.7-4.6A8.2 8.2 0 0 1 3 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5z',
  star: 'M12 3l2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1-6.2L3 9.6l6.2-.9L12 3z',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21v-2a8 8 0 0 1 16 0v2z',
};
export default function EventIcon({ name, size = 18, filled = false, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
    fill={filled ? 'currentColor' : 'none'} stroke={name === 'undo' ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[name] ?? paths.chevron} />
  </svg>;
}
