# 돈가스 지도 이벤트 웹

React 화면과 앱 WebView의 공용 통신 SDK. 스탬프·NFC/QR 방문 인증은 다음 작업이다.

## 실행

`npm ci` → `npm run dev` (5174). `npm test`, `npm run build`로 검증한다.
공개 API 주소는 `.env.example`을 참고한다. 토큰·GCS 키를 웹 환경변수에 넣지 않는다.
Vercel에 `katsu-map-event.vercel.app`으로 배포한다. 모든 경로는 React로 연결된다.

## 다음 이벤트 추가

1. `src/events`에 화면을 만들고 `src/events/index.js`에 새 경로를 등록한다.
2. 웹을 배포하고 어드민 ‘이벤트’에서 제목·같은 경로·홈 이미지를 등록한다.
3. 하나만 활성화한다. 지난 이벤트는 비활성 상태로 보관한다.

NFC/QR: `https://katsu-map-event.vercel.app/event/<ID>`.
앱 딥링크: `katsumap://event/<ID>`. 앱 배너에서도 ‘이벤트’를 선택한다.
비활성은 2초 안내 후 `katsumap://`로 앱 홈을 연다. 자동 실행이 차단되면 ‘돈가스 지도 열기’를 누른다.

## 앱 통신

화면은 `{ event, context, bridge }`를 받는다. `getContext()`는 기본 사용자 정보·앱 버전·플랫폼·safe area·지원 기능을 반환한다. 인증 토큰은 넘기지 않는다.

- `bridge.api('/context')`: 앱이 인증해서 `/api/v1/events/<현재 ID>/api/context`를 요청한다. 새 서버 기능도 이 네임스페이스에 추가한다. 임의 URL·헤더·토큰 전달은 차단한다.
- `bridge.getLocation()`: 위치 권한 후 좌표.
- `bridge.pickImage()`: 앨범 선택 후 1280px 이하 JPEG base64·크기. 취소는 `{canceled:true}`.
- `bridge.navigate('restaurant', {restaurantId: 1})`: 기존 앱 목적지로 이동. `home`, `encyclopedia_post`, `event` 등 지원.
- `bridge.share('문구')`, `bridge.haptic('light')`, `bridge.close()`.

프로토콜 v1: `katsu-event` 채널, 로드별 nonce, 요청 ID, method, payload. 응답은 `katsu-event-response` CustomEvent. 요청 제한 32KB(API 요청만 사진 전송용 3MB)·동시 8개·30초, 사진/위치는 120초.
NFC 링크의 `?source=nfc&code=...` 등 파라미터는 context.entry에 최대 10개 전달된다. 예약 필드·길이 제한을 적용하며, 서버 검증 없이 신뢰하지 않는다.
브라우저에서는 공개 안내만 제공한다. 브라우저 인증이나 스탬프 기능은 아직 없다.
이번 공용 구조를 지원하는 앱 업데이트가 먼저 필요하다. 이후 같은 브리지 기능으로 웹·서버 이벤트를 추가할 때 앱 업데이트는 필요 없다. 새 네이티브 기능은 업데이트가 필요하다.
