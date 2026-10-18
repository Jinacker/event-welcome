export const VENUE_URL = 'https://naver.me/FM94vb3l';

export function venueHref(native) {
  // 기존 앱이 HTTP 탐색을 외부 브라우저로 넘기는 경로를 재사용한다.
  // Vercel의 HTTPS 전환 후 고정된 네이버 링크만 연다.
  return native ? 'http://event-welcome.vercel.app/?openVenue=1' : VENUE_URL;
}
