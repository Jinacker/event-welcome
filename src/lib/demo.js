// 명시적으로 preview=1을 붙일 때만 표시. 인증 API·DB 저장·알림 없이 동작한다.
export function createEventDemo() {
  const title = '성북천 스탬프 투어';
  const image = '/demo-stamp.svg';
  const names = ['금왕돈까스', '오박사네왕돈까스', '서울왕돈까스', '호푸집', '카츠벨', '시올돈', '온달왕돈까스', '카츠노이에', '엘리카츠', '톤제',
    '곰돌이돈까스', '묘한경양식당', '밥이랑돈까스랑', '동경돈까스', '이세돈까스', '돈까스발전소', '시키카츠 고대점', '고래돈까스'];
  const stores = names.map((name, i) => ({ id: i + 1, name }));
  const goods = [['돈가스 NFC 키링', '11,000원', 'contain'], ['오리 NFC 키링', '11,000원', 'contain'], ['스티커팩', '6,000원', 'cover'],
    ['핀버튼', '1,500원', 'cover'], ['돈가스 수세미', '13,000원', 'cover'], ['티셔츠', '30,000원', 'cover']]
    .map(([name, price, fit], i) => ({ id: `demo-goods-${i + 1}`, name: `[목업] ${name}`, price, imageUrl: '/demo-katsu.svg', fit }));
  const month = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()).slice(0, 7);
  const event = { id: 1, title, webPath: '/seongbukcheon', enabled: true, buttonImageUrl: image,
    publicData: { description: '목업 미리보기입니다. 실제 일정과 참여 현황이 아닙니다.', stampGoal: 10 },
    stampTour: { enabled: true, restaurants: stores, stampImageUrl: image },
    giftshop: { note: '[목업] 라운지돌돌 현장 방문 시 최대 2,000원 할인', items: goods },
    // 일정 제목은 이벤트 웹의 상세 안내 키와 같게 둔다. 날짜는 어느 달에서도 보이도록 20~27일에 넣는다.
    calendar: [{ id: 'demo-show', title: '성북천 걸어서 돈가스 속으로 전시', startDate: `${month}-20`, endDate: `${month}-28`, description: '목업 일정 · 실제 행사 안내가 아닙니다.' },
      { id: 'demo-counsel', title: '돈가스 산책상담소', startDate: `${month}-23`, endDate: `${month}-24`, description: '목업 일정 · 실제 행사 안내가 아닙니다.' },
      { id: 'demo-hopu', title: '호푸집 팝업', startDate: `${month}-25`, endDate: `${month}-25`, description: '목업 일정 · 실제 행사 안내가 아닙니다.' },
      { id: 'demo-katsubell', title: '카츠벨 팝업', startDate: `${month}-27`, endDate: `${month}-27`, description: '목업 일정 · 실제 행사 안내가 아닙니다.' }] };
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, restaurantName: names[i], area: '성북구', satisfaction: 4 + i % 2,
    photoUrl: '/demo-katsu.svg', review: '바삭한 튀김옷과 촉촉한 고기! 성북천을 걸으며 만난 맛있는 돈가스 한 접시. 스탬프를 모으는 재미까지 더해졌어요.',
    user: { id: i + 1, nickname: `[목업] 산책자 ${i + 1}` }, createdAt: new Date().toISOString(), likeCount: 12 - i, commentCount: 5, viewCount: 100 - i * 6 }));
  const ranking = { eventId: 1, items: [{ rank: 1, userId: 1, nickname: '[목업] 돈가스산책', stampCount: 7, isProfilePublic: true },
    { rank: 1, userId: 2, nickname: '[목업] 성북천러버', stampCount: 7, isProfilePublic: true },
    { rank: 3, userId: 3, nickname: '[목업] 카츠탐험가', stampCount: 4, isProfilePublic: true },
    { rank: 4, userId: 4, nickname: '[목업] 미리보기', stampCount: 3, isProfilePublic: true, isMe: true }], me: null };
  const context = { event, user: { id: 4, nickname: '[목업] 미리보기' }, navigationTargets: ['event_map'] };
  const bridge = { isNative: true, isPreview: true, getContext: async () => context,
    api: async (path) => {
      if (path === '/context') return context;
      if (path === '/ranking') return ranking;
      if (path === '/feed') return { eventId: 1, items };
      if (path === '/stamps') return { eventId: 1, earned: 3, total: stores.length, stamps: stores.slice(0, 3).map((store) => ({ restaurantId: store.id })) };
      throw new Error('목업에 없는 요청입니다.');
    }, navigate: async () => { throw new Error('목업 화면에서는 실제 앱 이동을 하지 않습니다.'); }, dispose: () => {} };
  return { event, context, bridge };
}
