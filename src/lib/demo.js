// 명시적으로 preview=1을 붙일 때만 표시. 인증 API·DB 저장·알림 없이 동작한다.
export function createEventDemo() {
  const title = '성북천 스탬프 투어';
  const image = '/demo-stamp.svg';
  const names = ['카츠벨', '호푸집', '온달왕돈까스', '금왕돈까스', '서울왕돈까스', '카츠노이에', '톤제', '시올돈', '엘리카츠', '이세돈가스'];
  const stores = names.map((name, i) => ({ id: i + 1, name }));
  const month = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()).slice(0, 7);
  const event = { id: 1, title, webPath: '/seongbukcheon', enabled: true, buttonImageUrl: image, publicData: { description: '목업 미리보기입니다. 실제 일정과 참여 현황이 아닙니다.' },
    stampTour: { enabled: true, restaurants: stores, stampImageUrl: image },
    calendar: [{ id: 'demo-start', title: '스탬프 투어 시작', startDate: `${month}-01`, endDate: `${month}-07`, description: '참여 가게에서 첫 스탬프를 모아보세요.' },
      { id: 'demo-weekend', title: '성북천 돈가스 산책', startDate: `${month}-17`, endDate: `${month}-18`, description: '목업 일정 · 실제 행사 안내가 아닙니다.' }] };
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, restaurantName: names[i], area: '성북구', satisfaction: 4 + i % 2,
    photoUrl: '/demo-katsu.svg', review: '바삭한 튀김옷과 촉촉한 고기! 성북천을 걸으며 만난 맛있는 돈가스 한 접시. 스탬프를 모으는 재미까지 더해졌어요.',
    user: { id: i + 1, nickname: `[목업] 산책자 ${i + 1}` }, createdAt: new Date().toISOString(), likeCount: 12 - i, commentCount: 5, viewCount: 100 - i * 6 }));
  const ranking = { eventId: 1, items: [{ rank: 1, userId: 1, nickname: '[목업] 돈가스산책', stampCount: 7, isProfilePublic: true },
    { rank: 1, userId: 2, nickname: '[목업] 성북천러버', stampCount: 7, isProfilePublic: true },
    { rank: 3, userId: 3, nickname: '[목업] 카츠탐험가', stampCount: 4, isProfilePublic: true },
    { rank: 4, userId: 4, nickname: '[목업] 미리보기', stampCount: 3, isProfilePublic: true, isMe: true }], me: null };
  const context = { event, user: { id: 4, nickname: '[목업] 미리보기' }, navigationTargets: ['event_map'] };
  const bridge = { isNative: true, getContext: async () => context,
    api: async (path) => {
      if (path === '/context') return context;
      if (path === '/ranking') return ranking;
      if (path === '/feed') return { eventId: 1, items };
      if (path === '/stamps') return { eventId: 1, earned: 3, total: stores.length, stamps: stores.slice(0, 3).map((store) => ({ restaurantId: store.id })) };
      throw new Error('목업에 없는 요청입니다.');
    }, navigate: async () => { throw new Error('목업 화면에서는 실제 앱 이동을 하지 않습니다.'); }, dispose: () => {} };
  return { event, context, bridge };
}
