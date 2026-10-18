// 성북천 '걸어서 돈가스 속으로' 이벤트 웹의 고정 문구.
// 일정·굿즈·스탬프 수치는 서버 이벤트 설정에서 오고, 아래 안내 문구만 코드에 둔다.

export const banner = {
  collaboration: '돌고돌아성북천 × 카츠헌터',
  place: '성북천',
  titleLines: ['걸어서', '돈가스 속으로'],
  pills: ['맛집 추천', '굿즈 판매', '지도 전시'],
  venue: { name: '라운지돌돌', address: '서울시 성북구 성북로 62 2층' },
};

export const mapSection = {
  heading: '돈가스 산책 지도',
  intro: ['성북천 일대의 돈가스 맛집과 산책 스팟을 소개합니다.', '돈가스를 먹고 주변을 산책해보세요.'],
  label: '지도 보기',
  updateGuide: '이벤트 산책 지도를 보려면 돈가스 지도를 최신 버전으로 업데이트해주세요.',
};

export const stampSection = {
  rewardTitle: '스탬프 모아 럭키드로우!',
  prize: '총 35만 원 상당의 선물에 도전해보세요.',
  guide: (goal) => `지도에 소개된 서로 다른 가게 ${goal}곳의 방문 기록을 앱에 남기고 스탬프를 모아보세요.`,
  // 획득 칸에 찍히는 도장 문구.
  mark: ['걸어서', '돈가스', '속으로'],
  // 스탬프 N개째 칸 아래에 붙는 보상 안내.
  milestones: { 3: '추첨권 1장', 7: '추첨권 2장 추가', 10: '추첨권 2장 추가' },
  earlyNote: '10개 완주 후 라운지돌돌 방문 선착순 3명에게 티셔츠를 드려요.',
};

export const rewards = {
  title: '럭키드로우 선물',
  value: '총 35만 원 상당의 선물',
  intro: '스탬프를 모아 추첨권을 받고, 아래 선물에 도전하세요.',
  introNote: '럭키드로우 경품 및 완주 선착순 티셔츠 포함',
  stockHeading: ['선물', '남은 수량'],
  inventory: [
    { name: '한국식돈가스지도', stock: '1장' },
    { name: '돈가스지도 NFC 키링', stock: '2개' },
    { name: '오리 NFC 키링', stock: '2개' },
    { name: '돈가스 수세미', stock: '3개' },
    { name: '성북천도굴꾼 모자', stock: '1개' },
    { name: '성북천오리미니어쳐', stock: '2개' },
    { name: '성북천 자랑 ZINE(만화책)', stock: '1권' },
    { name: '스티커팩', stock: '10개' },
    { name: '뱃지', stock: '10개' },
  ],
  notes: [
    { text: '상품별 남은 수량입니다.' },
    { heading: '추첨 방법', text: '라운지 돌돌에서 앱의 스탬프 적립 내역 확인 후 추첨합니다.' },
    { heading: '수령 방법', text: '이벤트 기간 내 라운지 돌돌을 방문해 수령해 주세요.' },
  ],
};

export const policy = {
  title: '스탬프 참여 방법',
  notes: [
    '이 지도는 카츠헌터가 소개하는 성북천 주변 돈가스 가게를 담았습니다. 지도 수록은 각 가게의 이벤트 참여·제휴를 의미하지 않습니다.',
    '스탬프와 선물 이벤트는 카츠헌터·라운지 돌돌에서 운영합니다. 스탬프 적립·추첨·선물 관련 문의는 각 가게가 아닌 운영 측으로 부탁드립니다.',
  ],
  heading: '어떻게 받나요?',
  summary: (stores, goal) => [`지도에 소개한 가게는 총 ${stores}곳입니다.`, `서로 다른 가게 ${goal}곳의 방문 기록을 앱에 남기면 완주합니다.`],
  existing: ['지도에 소개된 가게의 방문 기록을 앱에 공개로 남겨주세요.', '사진 1장 이상·후기 30자 이상이면 앱에서 가게별 스탬프 1개가 적립돼요.'],
  standard: '사진 1장 이상·후기 30자 이상·공개 기록이 스탬프 인정 기준입니다.',
  items: (goal, period) => [
    { term: '같은 가게에서 여러 번 받기', description: `같은 가게는 1회만 인정됩니다. 서로 다른 가게 ${goal}곳의 스탬프를 모아주세요.` },
    { term: '기록 삭제·비공개 전환', description: '기록을 삭제하거나 비공개로 전환하면 해당 스탬프가 회수됩니다.' },
    { term: '참여 인정 기간', description: period ? `${period} 행사 기간에 앱에 작성한 기록만 인정됩니다.` : '행사 기간에 앱에 작성한 기록만 인정됩니다.' },
    { term: '럭키드로우 추첨권', description: '스탬프 3개 달성 시 1장, 7개 달성 시 2장 추가, 10개 달성 시 2장 추가로 총 5장을 드립니다.' },
    { term: '완주 선착순 선물', description: '스탬프 10개 완주 후 라운지돌돌을 방문한 순서대로 선착순 3명에게 티셔츠를 추가로 드립니다.' },
    { term: '추첨 방법', description: '라운지 돌돌에서 앱의 스탬프 적립 내역 확인 후 추첨합니다.' },
    { term: '수령 방법', description: '이벤트 기간 내 라운지 돌돌을 방문해 수령해 주세요.' },
  ],
};

export const storesPage = {
  title: '가게별 스탬프 현황',
  editorialNote: '이 지도는 카츠헌터가 소개하는 성북천 주변 돈가스 가게를 담았습니다. 지도 수록은 각 가게의 이벤트 참여·제휴를 의미하지 않습니다.',
  pending: '앱에서 내 스탬프를 불러온 뒤 가게별 획득 여부를 보여드려요.',
};

export const rankingPage = { title: '스탬프 랭킹', heading: '성북천 스탬프 랭킹', note: '같은 개수는 공동 순위' };

export const giftshopPage = { title: '기프트숍' };

export const activity = { heading: '성북천에서 먹었어요', note: '스탬프를 받은 공개 기록' };

export const schedule = { heading: '행사 안내' };

// 라운지돌돌 정기 휴무. 일정이 있는 날의 월요일 칸에 '휴무'로 표시한다.
export const closure = { weekday: 1, label: '휴무', title: '라운지돌돌 월요일 휴무' };

export const footer = { copy: '돈가스에 진심인 당신을 위한 단 하나의 지도', brand: '돈가스지도' };

export const schedulePending = '시간·장소·상세 안내는 추후 등록됩니다.';

// 일정 상세 창에 붙는 안내. 관리자가 등록한 일정 제목과 같은 키만 연결되고, 없으면 일정 설명을 그대로 보여준다.
export const scheduleDetails = {
  '성북천 걸어서 돈가스 속으로 전시': {
    venue: '라운지돌돌', address: '서울 성북구 성북로 62 2층', hours: '11:00–19:00', closed: '매주 월요일 휴무',
    lists: [
      { heading: '전시 콘텐츠', items: ['성북천 돈가스 지도 대공개 · 무료 배포', '카츠헌터 돈가스 덕질 애장품 전시', '돈가스 추억 게시판 운영'] },
      { heading: '기프트숍', items: ['돈가스 덕후를 위한 티셔츠·핀버튼 등 MD', '성북천 돈가스지도 NFC 키링', '카츠헌터 Pick 돈가스템 · 전국돈가스지도 등'] },
    ],
  },
  '돈가스 산책상담소': {
    program: '돈가스산책상담소 by 카츠헌터', programAddress: '라운지돌돌 · 서울 성북구 성북로 62 2층', schedule: '10.23(금)–24(토) 11:00–19:00',
    description: '성북천을 산책하며 가볼 만한 돈가스 집을 소개해드립니다. 평소 어떤 스타일의 돈가스를 좋아하는지 이야기를 나누고, 취향에 맞는 돈가스집부터 미처 몰랐던 동네의 돈가스 이야기까지 함께 추천해드립니다.',
    gift: '상담하시면 무료 스티커를 나눠드립니다.',
  },
  '호푸집 팝업': {
    program: '돌돌호푸카츠산도', programAddress: '서울 성북구 성북로14길 7', partner: '@hopuzip', partnerUrl: 'https://www.instagram.com/hopuzip/', schedule: '10.25(일) · 시간 추후 공지',
    description: '돌돌호푸 시즌3, 이번에는 호푸집의 시그니처 안주 돈가스를 산도로 재해석합니다. 날씨 좋은 가을날의 오후, 한 손에 카츠산도 한 손에 맥주 들고 성북동 산책 어떠세요?',
  },
  '카츠벨 팝업': {
    program: '돈가스 타코 팝업', programAddress: '서울 성북구 성북로 31 지상1층', partner: '@katsubell_', partnerUrl: 'https://www.instagram.com/katsubell_/', schedule: '10.31(토) · 시간 추후 공지',
    description: '성북동에 어느 날 등장한 일식 카츠 강자 카츠벨. 바삭하고 부드러운 안심카츠를 타코에 넣고 육즙 가득한 가라아게와 함께 내어드립니다.',
  },
};
