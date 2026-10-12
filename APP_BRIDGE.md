# 앱 ↔ 이벤트 웹 연결 가이드

2026-10-12 코드 기준. 이벤트 화면을 만드는 에이전트가 먼저 읽는 공용 브리지 설명서다.
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
| event | `id`, `title`, `enabled`, `webPath`, `webUrl`, `buttonImageUrl`, `publicData`, optional `stampTour` |
| platform | `ios` / `android` |
| appVersion | 앱 버전 문자열 |
| safeArea | `{ top, bottom, left, right }` |
| entry | NFC·QR·딥링크에서 전달된 query 정보 |
| bridgeVersion | 현재 1 |
| capabilities | 지원하는 프로토콜 method 이름 배열 |

사용자 정보는 앱의 현재 세션 사용자다. user가 있다는 사실만으로 별도의 소셜 로그인 완료·이벤트 참여 완료를 판정하지 않는다.
user가 null이거나 nickname이 없을 수 있으므로 표시할 때 기본값을 둔다.
현재 웹 상단은 nickname이 있으면 `OOO님 환영이에요!`, 없으면 `환영해요!`를 표시한다.
context는 요청 시점의 값이다. 사용자 정보를 다시 확인하려면 getContext를 다시 호출하거나 인증 API `/context`를 요청한다.
현재 App.jsx의 주기적 `/context` 조회는 이벤트 상태만 갱신하며 context.user를 자동으로 갱신하지 않는다.

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
| navigate(target, params) | navigation.open | 지정한 앱 화면으로 이동하고 이벤트 웹뷰 닫기 |
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

navigate와 close는 웹뷰를 닫는다. 호출 후에도 웹 페이지가 남아서 후속 처리를 할 것으로 가정하지 않는다.

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
| restaurant | restaurantId |
| profile | userId |
| note | noteId |
| encyclopedia_post | postId |
| event | eventId |

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
| GET /api/v1/events/:id/api/stamps | 현재 세션 사용자만의 적립 내역·총 칸 수 조회. 활성 상태 필요 |

스탬프는 기존 앱의 새 공개 기록 저장 시 서버에서 자동 적립한다. 사진 1장 이상, 후기 앞뒤 공백 제거 후 Unicode 문자 30개 이상,
활성 이벤트의 참여 가게 조건을 모두 만족해야 한다. 기존 photoUrl과 새 photoUrls 모두 지원한다.
같은 이벤트·사용자·가게는 한 장만 받으며 수정·공개 전환은 소급 적립하지 않는다. 적립 후 기록 삭제·수정은 스탬프를 회수하지 않는다.
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
일반 브라우저에는 네이티브 브리지가 없다. 공개 이벤트 API로 안내를 조회하며 앱 기능 호출은 제공되지 않는다.
브라우저에서 Failed to fetch가 나면 API 배포 상태·CORS·GCS 조회·웹 CSP를 확인한다. 앱 전용 접근 차단 메시지가 아니다.
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
