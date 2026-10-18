# 앱 ↔ 이벤트 웹 연결 가이드

2026-10-18 코드 기준. 이벤트 화면을 만드는 에이전트가 먼저 읽는 공용 브리지 설명서다.
실제 배포 주소는 `https://event-welcome.vercel.app`이다. 이 저장소에서는 README를 만들지 않는다.

## 시작 위치

- 웹 SDK: [src/bridge/client.js](./src/bridge/client.js)
- 연결·상태 초기화: [src/App.jsx](./src/App.jsx)
- 이벤트 화면 등록: [src/events/index.js](./src/events/index.js)
- 앱 처리기: [EventWebViewModal.js](../katsu-map-app/src/components/EventWebViewModal.js)
- 앱 context·검증: [eventBridge.js](../katsu-map-app/src/utils/eventBridge.js)
- 서버 API: [event.controller.ts](../katsu-map-server/src/modules/event/event.controller.ts)

App.jsx가 SDK 인스턴스를 만들고 이벤트 화면에 `{ event, context, bridge }`를 전달한다.
화면에서는 전달받은 bridge를 재사용한다. 화면마다 SDK 인스턴스를 새로 만들거나 postMessage 프로토콜을 직접 재구현하지 않는다.
bridge 호출은 Promise이며, 결과 또는 오류로 돌아온다. 페이지가 닫히면 남은 요청은 취소된다.

## 앱에서 받을 수 있는 context

`await bridge.getContext()` 또는 화면의 `context` prop을 사용한다.

| 필드 | 실제 전달 값 |
| --- | --- |
| user | `{ id, nickname, profilePhotoUrl }` 또는 null |
| event | `id`, `title`, `enabled`, `webPath`, `webUrl`, `buttonImageUrl`, `publicData`, optional `stampTour`, `calendar`, `mapView`, `mapMessage`, `giftshop` |
| platform | `ios` / `android` |
| appVersion | 앱 버전 문자열 |
| safeArea | `{ top, bottom, left, right }` |
| entry | NFC·QR·딥링크에서 전달된 query 정보 |
| bridgeVersion | 현재 1 |
| capabilities | 지원하는 프로토콜 method 이름 배열 |
| navigationTargets | 새 목적지 지원 여부. 현재 `["event_map"]`, 구버전에는 없음 |

사용자 정보는 앱의 현재 세션 사용자다. user가 있다는 사실만으로 별도의 소셜 로그인 완료·이벤트 참여 완료를 판정하지 않는다.
user가 null이거나 nickname이 없을 수 있으므로 표시할 때 기본값을 둔다.
웹 최상단 환영 문구는 표시하지 않는다. nickname은 내 스탬프 제목에 사용한다.
context는 요청 시점의 값이다. 사용자 정보를 다시 확인하려면 getContext를 다시 호출하거나 인증 API `/context`를 요청한다.
주기적 `/context` 조회는 이벤트 상태만 갱신한다. 사용자 닉네임은 이벤트 화면을 새로 열 때 context에서 받는다.

```js
const current = await bridge.getContext();
const nickname = current.user?.nickname;
const eventId = current.event.id;

// 지원 여부를 먼저 확인하면 이후 앱 버전 차이를 처리할 수 있다.
if (current.capabilities.includes('location.get')) {
  const position = await bridge.getLocation();
}
```

## 웹에서 호출할 수 있는 앱 기능

| SDK 함수 | 프로토콜 method | 동작·반환 |
| --- | --- | --- |
| getContext() | context.get | 위 context 반환 |
| api(path, options) | api.request | 현재 이벤트 전용 API를 앱 인증으로 요청하고 응답 data 반환 |
| getLocation() | location.get | 위치 권한 요청 후 `{ latitude, longitude, accuracy, timestamp }` 반환 |
| pickImage() | image.pick | 앨범에서 사진 1장 선택 후 JPEG base64·크기 반환 |
| navigate(target, params) | navigation.open | 지정한 앱 화면으로 이동. 최신 앱의 restaurant는 이벤트 위 상세 모달 표시 |
| share(message) | share | 운영체제 공유창, `{ action }` 반환 |
| haptic(style) | haptic | light / medium / heavy 진동. 기본 light |
| close() | close | 이벤트 웹뷰 닫기 |

위치·사진 권한 거부, 요청 실패와 취소를 구분해서 처리한다.
사진 선택 취소는 `{ canceled: true }`다. 선택 성공은 아래 형태다.

```js
const image = await bridge.pickImage();
if (!image.canceled) {
  // image: { canceled: false, mimeType: 'image/jpeg', width, height, base64 }
  // 긴 변은 최대 1280px이며 base64 문자열은 최대 2 * 1024 * 1024자다.
  // 파일 선택만 제공한다. 실제 업로드·저장은 별도 이벤트 서버 API를 구현해야 한다.
}

await bridge.share('성북천 이벤트에 함께 참여해요!');
await bridge.haptic('light');
```

close는 이벤트 레이어만 닫고 탭은 이동하지 않는다. navigate는 보통 이벤트를 닫고 지정한 화면으로 이동한다. 최신 앱의 restaurant 목적지는 이벤트를 유지한 채 가게 상세 모달만 위에 열며, 모달을 닫으면 보던 이벤트로 돌아온다. 구버전 앱의 restaurant는 기존 홈 지도 이동을 유지한다.

굿즈의 `giftshop.items[].linkUrl`은 optional 구매 URL이다. 2048자 이하의 https 주소만 허용하며 자격정보·공백·제어문자·역슬래시가 있는 주소는 거부한다. 서버 저장 시 기존 굿즈에서 이 필드가 누락되면 기존 링크를 보존하고, null·빈 문자열은 링크를 지운다. 신규 굿즈에서 누락되면 구매 버튼 없이 표시한다.

굿즈 카드·전체 목록의 사진·상품명은 구매 링크로 바로 연결한다. 별도 `스토어에서 보기` 버튼은 표시하지 않는다. 링크가 없는 사진만 기존 확대 팝업을 연다. 공유창·복사 기능은 구매 동선에서 사용하지 않는다.

- 일반 브라우저는 등록된 https URL을 새 탭으로 연다.
- 앱은 `http://event-welcome.vercel.app/?eventId=…&openStore=1&goodsId=…`를 `_self` 링크로 누른다. 현재 앱의 `originWhitelist`는 https와 katsumap만 포함하며, 설치된 react-native-webview 13.16.1은 목록 밖 주소를 `Linking.canOpenURL` → `Linking.openURL`로 넘긴 뒤 WebView 탐색을 취소한다. 이 기존 동작을 사용하므로 앱 코드·브리지 기능을 추가하지 않는다.
- 외부 브라우저에서 Vercel이 진입 주소를 HTTPS로 전환한다. 실제 배포 주소에서 HTTP 308과 query 보존을 확인했다. HTTPS 페이지는 공개 이벤트 설정에서 해당 이벤트·굿즈의 구매 URL을 찾아 바로 이동한다.
- 진입 주소에는 공개 ID만 넣는다. 사용자 정보·인증 토큰·임의 목적지 URL을 넣지 않는다. query로 목적지 URL을 받아 이동하지 않는다. 설정 조회와 최종 스토어 주소는 HTTPS를 사용한다. 초기 HTTP 진입 자체는 암호화된 통신이 아니므로 이 주소에 비밀값을 추가하면 안 된다.
- 이벤트 종료·상품 삭제·링크 미설정·잘못된 ID·네트워크 실패는 외부 브라우저에서 안내와 재시도를 제공한다. WebView와 일반 브라우저의 실제 OS 연결은 iOS·Android 실기 확인이 필요하다.

## 앱 화면 이동

```js
await bridge.navigate('restaurant', { restaurantId: 123 });
await bridge.navigate('encyclopedia_post', { postId: 9 });
await bridge.navigate('profile', { userId: 123 });
await bridge.navigate('event', { eventId: 2 });
await bridge.navigate('home');
```

| target | 필요한 params |
| --- | --- |
| home, encyclopedia, community, tasting, settings, ranking | 없음 |
| messages, notices, new_record | 없음 |
| restaurant | restaurantId. 최신 앱은 이벤트를 유지하며 가게 상세 모달만 열기 |
| profile | userId |
| note | noteId |
| encyclopedia_post | postId |
| event | eventId |
| event_map | eventId. 참여 가게만 지도·목록으로 열기. navigationTargets 지원 확인 필요 |

ID는 숫자 타입의 양의 정수이며 최대 2147483647이다. 문자열 ID와 목적지에 없는 params는 거부된다.
임의 React Navigation 화면 이름·외부 URL을 navigate에 넣을 수 없다.

## 인증 이벤트 API

```js
// 현재 구현된 인증 API
const result = await bridge.api('/context');
// result: { event, user: { id, nickname, profilePhotoUrl } }

// 현재 로그인된 앱 세션 사용자의 스탬프 조회 (적립 POST API는 제공하지 않음)
const progress = await bridge.api('/stamps');
// { eventId, total, earned, stamps: [{ id, restaurantId, restaurantName, earnedAt }] }
```

`bridge.api('/context')`는 앱이 `/api/v1/events/<현재 이벤트 ID>/api/context`를 요청한다.
앱의 기존 API 클라이언트가 인증을 처리하므로 웹에서 토큰을 받거나 Authorization 헤더를 만들 필요가 없다.
SDK options는 `method`, `data`, `params`를 지원한다. method는 GET / POST / PUT / PATCH / DELETE이며 기본 GET이다.
params 값은 문자열·숫자·boolean만 허용한다.

현재 이벤트 네임스페이스 밖의 API, 다른 이벤트 ID, 절대 URL, query를 포함한 path, `..`, 임의 headers는 거부된다.
path는 `/stamps/list`처럼 영문·숫자·underscore·hyphen으로 된 상대 경로만 사용한다. query는 options.params로 전달한다.

현재 서버에서 제공하는 이벤트 API:

| 경로 | 인증·동작 |
| --- | --- |
| GET /api/v1/events/:id | 공개 설정 조회. 비활성도 조회 가능 |
| GET /api/v1/events/:id/api/context | 사용자 세션 인증 및 활성 상태 확인 |
| GET /api/v1/events/:id/api/ranking | 현재 보유 개수 공동 순위. 상위 20위 최대 100명 및 내 순위. 비공개 프로필 가림 |
| GET /api/v1/events/:id/api/feed | 이번 주(KST 월요일 기준) 스탬프 지급 원본 중 공개·미삭제 기록 반응 TOP 10 |
| GET /api/v1/events/:id/api/map | 활성 투어 참여 가게의 기존 지도 DTO와 초기 시점 |
| GET /api/v1/events/:id/api/stamps | 현재 세션 사용자만의 적립 내역·총 칸 수 조회. 활성 상태 필요 |

스탬프는 기존 앱의 새 공개 기록 저장 시 서버에서 자동 적립한다. 사진 1장 이상, 후기 앞뒤 공백 제거 후 Unicode 문자 30개 이상,
활성 이벤트의 참여 가게 조건을 모두 만족해야 한다. 기존 photoUrl과 새 photoUrls 모두 지원한다.
같은 이벤트·사용자·가게는 한 장만 받으며 수정·공개 전환은 소급 적립하지 않는다. 적립 후 내용 수정·나만보기·재공개는 스탬프를 유지한다. 사용자 기록 삭제·관리자 커뮤니티 삭제·관리자 기록 삭제/숨김은 해당 원본 기록으로 받은 스탬프를 회수한다.
스탬프를 받지 않은 중복 기록을 삭제해도 다른 기록의 적립은 유지한다. 관리자 숨김 해제·재공개는 회수한 스탬프를 자동 복원하지 않는다.
회수 뒤 활성 이벤트에서 새 조건 충족 공개 기록을 저장하면 같은 가게에서도 다시 한 장을 받을 수 있다. 과거 삭제로 sourceNoteId가 null이 된 적립은 일괄 정리하지 않는다.
스탬프 적립 API나 NFC 방문 인증·이벤트 사진 업로드 API는 제공하지 않는다. entry.code로 적립을 요청하지 않는다.

이벤트 optional stampTour 설정:

```js
{
  enabled: true,
  restaurants: [{ id: 123, name: '참여 가게' }], // 설정 순서, 최대 200곳
  stampImageUrl: '어드민 이벤트 전용 업로더가 반환한 GCS URL',
  pinMode: 'same', // 또는 byRating
  pinImageUrl: '공통 핀 URL', // 빈 문자열이면 기존 핀
  ratingPinImages: { '1': '★1 핀 URL', '2': '★2 핀 URL' }, // 1=normal, 2=good, 3=best, 4=top5
  startedAt: '서버가 지정한 활성 시작 ISO 시각'
}
```

startedAt은 읽기 전용으로 생각한다. 어드민이 활성화할 때 서버가 지정하며 비활성 후 다시 켜면 갱신한다.
새 투어에는 새 이벤트 ID를 사용한다. 기존 ID를 다시 활성화하면 기존 스탬프·가게별 중복 제한을 이어서 사용한다.
StampTourBoard는 참여 가게 수만큼 칸을 만들고 실제 earned 수만 앞에서부터 채운다. 17곳을 등록하면 17칸이다.
가게 설정이 줄어도 이미 받은 스탬프는 표시한다. native 브리지에서 /stamps를 처음·60초 간격·웹 visible 전환에 조회한다.
브라우저에는 인증 브리지가 없으므로 앱 열기 안내를 표시한다. 조회 실패는 0개 적립으로 확정하지 않고 재시도 안내를 표시한다.
사진·후기 조건 미달이어도 기존 기록 저장은 성공한다. 적립 저장 장애 시 기록 응답의 optional eventStamp.status가 unavailable이며 기록은 유지된다.
적립 관련 대기는 전체 최대 3초이며 제한 이후 늦게 받은 설정으로 새 DB 적립을 시작하지 않는다. 푸시 HTTP는 최대 1.5초다.
이미 적립 커밋이 확인됐으면 푸시가 늦어도 earned를 반환한다. 제한 당시 진행 중이던 DB 쓰기는 늦게 완료될 수 있어 unavailable은 미적립 확정이 아니다.
자동 재적립 작업은 없으므로 해당 장애는 스탬프판 재조회와 문의·서버 운영 확인이 필요하다.
새 서버 기능을 `/events/:id/api/...` 아래에 추가하면 이 브리지로 앱 업데이트 없이 호출할 수 있다.
새 쓰기 API는 서버에서 세션 인증, 실제 참여 권한·입력 검증·중복 처리와 requireActive를 적용해야 한다.

## NFC·QR·진입 정보

- 웹 진입: `https://event-welcome.vercel.app/event/<ID>?source=nfc&code=...`
- 앱 진입: `katsumap://event/<ID>?source=nfc&code=...`
- 이벤트 화면: 등록한 웹 경로에 `?eventId=<ID>`를 붙여 연다.
- query 정보는 앱을 거쳐 context.entry로 전달된다.
- 최대 10개, 키는 영문·숫자·underscore·hyphen 1~40자, 값은 최대 512자다.
- `eventId`, `native`, `__proto__`, `constructor`, `prototype`은 entry에서 제외한다.

entry는 사용자가 변조할 수 있는 진입값이다. code·source만 보고 적립을 인정하지 않고 서버에서 검증한다.
URL의 native=1이나 bridge.isNative는 UI 분기용이다. 서버 인증을 대신하지 않는다.

## 브라우저·비활성·오류 처리

앱 웹뷰에서는 bridge.isNative가 true이며 앱 context를 사용한다.
일반 브라우저에는 네이티브 브리지가 없다. 같은 웹 주소의 `/event-config.json`에서 공개 이벤트 설정을 읽어 첫 화면을 표시한다.
Vite는 해당 경로를 GCS 공개 파일에 프록시하고, Vercel은 HTML fallback 전에 동일 파일로 rewrite한다. 브라우저가 GCS를 직접 fetch하거나 운영 이벤트 API를 호출하지 않는다.
브라우저에서 Failed to fetch가 나면 이 설정 경로의 응답·JSON·프록시/rewrite 적용·웹 CSP를 확인한다. 앱 전용 접근 차단 메시지가 아니다.
Vercel 웹 배포와 서버 배포는 별개다.

비활성은 `현재 이벤트 비활성화입니다`를 2초 보여주고 앱에서는 홈으로, 브라우저에서는 `katsumap://`로 이동을 시도한다.
조회 장애를 비활성으로 간주하지 않는다. 비활성 인증 API는 서버에서 410으로 거부한다.
SDK 오류는 Error이며 앱의 HTTP 오류는 code 문자열로 전달될 수 있다. 네트워크·검증 오류는 FAILED 또는 code가 없을 수 있다.

```js
try {
  const result = await bridge.api('/context');
} catch (error) {
  if (error.code === '410') {
    // 비활성 처리. 앱의 상위 웹뷰도 활성 상태를 확인한다.
  } else {
    // 재시도·권한 안내 등 해당 화면에 필요한 처리를 한다.
  }
}
```

## 프로토콜·제한·보호 범위

직접 메시지를 보내기보다 SDK를 사용한다. 요청은 channel=katsu-event, version=1, 로드별 nonce, id, method, payload를 포함한다.
앱은 bootstrap 후 katsu-event-ready 이벤트로 준비를 알린다. 응답은 katsu-event-response CustomEvent이며 id·nonce로 매칭한다.
성공 응답은 `{ id, nonce, ok: true, result }`, 실패는 `{ id, nonce, ok: false, error: { code, message } }`다.

- 준비 대기 6초, 일반 응답 대기 30초, 사진·위치 응답 대기 120초.
- SDK 동시 요청 최대 8개. 같은 요청 ID를 앱에서 중복 실행하지 않는다.
- JSON 문자열 길이 기준 일반 요청 최대 32768자, api.request 최대 3 * 1024 * 1024자.
- 이벤트 서버의 JSON 본문 제한은 3MB다. 앱의 API 전송 timeout은 15초다.
- 앱은 서버가 지정한 웹 origin·경로·eventId를 확인하고 파일·외부 페이지·iframe 탐색을 제한한다.
- 세션 토큰·UUID·소셜 식별자·GCS 키를 context에 넘기지 않는다. Axios 요청 헤더나 오류 전체도 웹으로 전달하지 않는다.
- 사용자 context나 사진 base64를 URL·공개 설정 publicData에 넣거나 로그로 출력하지 않는다.

## 다음 이벤트를 추가할 때

1. src/events에 화면을 만들고 index.js에 웹 경로를 등록한다.
2. 제공된 event·context·bridge를 재사용한다.
3. 필요한 서버 API를 현재 이벤트의 /api 네임스페이스에 구현한다.
4. 웹·서버를 배포하고 어드민에서 경로·이미지·활성 상태를 설정한다. 한 번에 하나만 활성화한다.

현재 브리지 기능으로 만드는 웹·서버 기능은 이후 앱 업데이트 없이 추가할 수 있다.
새 네이티브 기능·새 화면 목적지·새 프로토콜 버전을 요구하면 앱 수정·업데이트가 필요하다.
사용자 개인정보 필드를 더 전달하는 것도 현재 허용 범위를 바꾸는 작업이므로 먼저 앱·서버 호출 흐름과 범위를 확인한다.

## 랭킹·피드·캘린더·지도

```js
const ranking = await bridge.api('/ranking');
// { eventId, items: [{ rank, userId|null, nickname, profilePhotoUrl|null, stampCount, isMe, isProfilePublic }], me|null }
const feed = await bridge.api('/feed');
// { eventId, items: 기존 커뮤니티 피드 카드 필드[] }
const map = await bridge.api('/map');
// { eventId, title, view: { lat, lng, level }, restaurants: 기존 가게 목록 DTO[] }
if (context.navigationTargets?.includes('event_map')) {
  await bridge.navigate('event_map', { eventId: event.id });
}
```

보유 스탬프 수만으로 공동 순위를 정한다(예: 1·1·3위). 나만보기 전환으로 보유 수가 줄지 않으며 삭제 회수는 반영된다.
비공개 프로필의 닉네임·사진·ID는 다른 사용자에게 노출하지 않는다. 랭킹은 상위 20위까지 최대 100명을 반환하며 본인 순위는 별도로 반환한다.
피드는 실제 스탬프를 받은 원본 기록에 한한다. 나만보기 기록·삭제/숨김 기록은 표시하지 않는다.
서버 반응 점수는 조회수+좋아요+미삭제 댓글 수다. 클라이언트는 기존 앱 hotFeedSelection과 동일하게 TOP10에서 랜덤4개를 뽑아 반응 순으로 정렬한다.
이벤트·스탬프판·랭킹·피드는 처음과 60초 및 visible 전환에 갱신한다. 장애 때 빈 목록/0개로 확정하지 않고 재시도한다.

기존 앱 커뮤니티·프로필 기록 응답에는 실제 지급 원본에만 optional `eventBadges: [{ eventId, title, stampImageUrl }]`가 추가된다.
비활성 이벤트도 설정을 보관하므로 배지는 남는다. 로고를 별도 복사하거나 DB에 보존하지 않으며 어드민 로고 변경은 과거 카드에도 반영된다.
설정/스탬프 조회 장애 또는 테이블 미반영 시 기존 피드 반환을 유지한다. optional 표시 조회 대기는 최대 1초다.
앱 NoteMediaGrid의 오각형 중앙에 표시한다. 새 앱 업데이트 전에는 기존 카드가 그대로 보인다.

성북천 캘린더·일정 팝업은 `seongbukcheon-standalone.html`에서 옮긴 `src/events/seongbukcheonCalendar.json`과 `seongbukcheonSchedule.js`의 고정 콘텐츠를 사용한다. 배너·참여 기간도 이 일정에서 계산한다. 서버의 `event.calendar`는 성북천 화면에 사용하지 않으며 어드민 캘린더 편집 섹션은 숨긴다. 기존 API와 저장 데이터는 유지한다.

`event.calendar`는 최대 100개 `{ id, title, startDate, endDate, description }`다. 날짜는 YYYY-MM-DD, 기간 종료는 시작 이상이다.
`event.mapView`는 optional `{ lat, lng, level }` 또는 null이다. null/누락이면 참여 가게 평균 좌표와 레벨5를 쓴다. 레벨 범위1~14, 작을수록 확대한다.
일정은 표시 전용이며 자동 활성화·비활성화 스케줄러는 없다. 옛 관리자 payload에서 새 필드를 생략해도 저장된 값을 보존한다.
일정은 `[]`, 지도 시점은 `null`로 명시적으로 해제한다.
네이티브 이벤트 지도는 현재 이벤트 API에서만 가게를 받고 별도 전체 가게 조회를 하지 않는다. 활성 상태는 60초/앱 foreground 때 재확인하고 410이면 닫는다.
지도 HTML은 변경하지 않고 기존 UPDATE_RESTAURANTS에 필터된 목록을 전달한다. 홈을 벗어나거나 새로운 Home 가게 공유 요청이 오면 지도 모달을 닫아 기존 푸시·공유 이동을 가리지 않는다.

## 목업 확인

- 로컬 `npm run dev` 실행 후 `/seongbukcheon?preview=1`: 공동 순위·피드·스탬프·캘린더를 인증/API 없이 미리 본다. 브라우저에서만 허용하며 ‘목업’ 안내를 표시한다.
- 이 query 미리보기는 코드 배포 후 `https://event-welcome.vercel.app/seongbukcheon?preview=1`에도 사용할 수 있다. 실제 앱 이동·적립은 실행하지 않는다.
- 테스트 DB 실제 목업: 서버에서 `node -r dotenv/config -r ts-node/register scripts/seed-event-preview.ts dotenv_config_path=.env.test`.
- 테스트 DB 전용 가드, 목업 사용자5명·기록/스탬프22개(7·7·4·3·1). 재실행은 목업 전용 UUID의 데이터만 갱신한다. 운영 DB·공개 이벤트 일정·푸시는 변경하지 않는다.

## 이벤트 화면 닫기

우측 하단 뒤로가기 버튼은 웹 팝업 → 이전 웹 화면 → 이벤트 홈 순서로 돌아간다. 이벤트 홈에서만 기존 `bridge.close()`로 이벤트 레이어를 닫고 커뮤니티 탭을 유지한다. 랭킹·가게·굿즈·팝업은 같은 URL의 History 항목으로 관리하므로 브라우저 뒤로/앞으로 가기도 내부 화면을 복원한다. URL의 eventId·native와 앱 브리지는 변경하지 않는다. Android 시스템 뒤로가기는 앱에서 직접 이벤트를 닫아 웹에 전달되지 않으므로 기존 동작이 유지된다.
앱 즐겨찾기 지도의 원형·그림자·Material Design Icons arrow-u-left-top을 사용하고, 배경은 앱 키 컬러(#d6483e), 화살표는 흰색이다.
크기는 iOS48px/Android44px이며 context.platform으로 구분한다. 오른쪽 여백은22px이다. 목업에서는 홈의 닫기만 비활성화하고 내부 화면의 뒤로가기는 사용할 수 있다. 일반 브라우저에서는 아래 스토어 안내 정책을 적용한다.
브리지 닫기 실패는 오류를 표시하고 이벤트에 머문다. 비활성 안내 후 2초 자동 홈 이동과 오류 화면의 앱 열기 링크는 기존 정책을 유지한다.

성북천 피드 카드는 앱 HotFeedCard처럼 사진과 가게·별점·후기를 좌우로 배치하고 작성자·상대 시간·좋아요·댓글을 표시한다.
TOP10 중 랜덤4개 선택, 기록 상세 이동과 랭킹·스탬프의 주기적 조회는 유지한다.


## 이벤트 진입과 갱신

앱의 홈 이벤트 버튼, 커뮤니티 기록 버튼 위의 이벤트 이미지 버튼, 이벤트 딥링크와 배너는 모두 커뮤니티 탭으로 이동한 뒤 이벤트 웹을 표시한다.
웹은 커뮤니티 위 레이어에서 열리며 하단 탭바를 덮지 않는다. 상단 네이티브 헤더는 가운데 정렬한 `이벤트`만 표시하고 닫기 버튼은 표시하지 않는다.
Android 뒤로가기나 기존 bridge.close()는 이벤트만 닫아 커뮤니티를 보여준다.
다른 탭을 선택하면 이벤트 레이어도 닫힌다. 웹의 우측 하단 버튼은 close 브리지로 레이어만 닫는다.
이벤트가 열린 상태에서 커뮤니티 탭을 다시 누르면 이벤트만 닫는다. 이벤트가 없을 때의 커뮤니티 재탭 초기화·갱신 동작은 유지한다.
이 진입 방식과 탭바 유지에는 앱 업데이트가 필요하며 구버전 앱의 브리지 계약은 유지한다.

사용자 요청으로 당겨서 새로고침 제스처와 상단 로딩 표시는 제거했다. 웹 배포로 반영되며 새 앱 기능을 요구하지 않는다.
네이티브 WebView도 pullToRefreshEnabled=false로 설정한다. iOS는 bounces=true, decelerationRate=normal로 앱 ScrollView에 가까운 스크롤을 사용한다. 이 네이티브 설정·헤더 변경에는 앱 업데이트가 필요하다.
설정·랭킹·피드·스탬프의 초기 조회, 60초 주기 및 visible 전환 갱신, 오류 후 재시도는 유지한다.
조회 실패를 비활성이나 0개 적립으로 확정하지 않는다. 비활성410은 기존 안내·2초 후 앱 홈 이동으로 처리한다.
개별 로더의 singleFlight 중복 요청 방지도 유지한다.
현재 캘린더는 일정이 걸치는 달만 넘길 수 있으며 기간을 주 단위 막대로 표시한다. 막대 안에 제목을 넣고 겹치는 일정은 줄을 나눈다.


## 이벤트 참여 가게 상세와 피드 스탬프

참여 가게 버튼은 기존 `bridge.navigate('restaurant', { restaurantId })`를 사용한다. 최신 앱은 기존 캐시 조회로 가게를 읽은 뒤 커뮤니티의 RestaurantDialog를 이벤트 위에 표시한다.
가게를 닫으면 이벤트의 스크롤·조회 데이터가 남는다. 상세의 지도 보기 버튼을 선택해야 홈 지도로 이동한다. 즐겨찾기와 기록·공유 등 기존 상세 기능을 재사용한다.
가게 조회 실패는 이벤트를 유지하며 안전한 오류를 웹에 반환한다. 조회 중 이벤트가 닫히거나 교체되면 늦은 응답으로 모달을 열지 않는다.
이 동작에는 앱 업데이트가 필요하며 구버전 앱은 같은 restaurant 목적지에서 기존 홈 지도로 이동한다. 새 target·method·서버 API는 추가하지 않는다.
앱 피드·프로필·댓글 기록의 이벤트 스탬프는 오각형 중앙 대신 작성자 줄 우측 상단에 표시한다. 비활성 이벤트 배지 보존과 서버 전달 형식은 유지한다.


## 일반 웹 첫 화면과 다운로드 안내

- `/`는 공개 설정에서 활성 이벤트를 먼저 고른다. 전부 비활성이면 최신 이벤트를 골라 기존 비활성 안내를 적용한다.
- `/seongbukcheon`, `/event/<ID>`, `?eventId=<ID>`도 같은 공개 설정으로 조회한다. 잘못된 ID나 없는 이벤트는 다른 이벤트로 돌리지 않는다.
- 활성 이벤트의 ID 링크도 먼저 웹을 보여준다. 웹 진입만으로 자동 앱 실행을 시도하지 않는다. 앱의 직접 이벤트 딥링크와 entry 처리 방식은 유지한다.
- 브라우저의 가게·지도·스탬프·랭킹·피드·다운로드 버튼 클릭은 App의 capture에서 네이티브 기능 호출 전에 스토어로 연결한다. 아이폰/아이패드(데스크톱 UA의 iPad 포함)는 App Store, 안드로이드와 일반 PC는 Google Play다.
- 일반 브라우저는 개인 스탬프·랭킹·피드 인증 API를 호출하지 않는다. 미조회 스탬프를0개로 확정하거나 개인정보 목업을 실제 정보처럼 표시하지 않는다.
- 앱 웹뷰와 명시적 preview 목업은 이 스토어 분기를 적용하지 않고 기존 브리지와 기능을 유지한다.
- 공개 화면은 VITE_API_URL을 사용하지 않는다. 앱의 실제 API 주소와 인증 처리는 앱에서 관리한다.
- 공개 설정은 기존 공개 GCS 파일만 연결한다. 버킷 권한·CORS·비밀 키·운영 DB를 바꾸지 않는다. Vercel 변경은 웹 재배포 후 반영된다.
