import { rewards } from '../events/seongbukcheonContent.js';

const MAX_ITEMS = 30;
const text = (value) => typeof value === 'string' ? value.trim() : '';

// 0개로 적힌 수량과 '품절'은 같은 뜻으로 본다.
const emptied = (stock) => /품절|sold ?out/i.test(stock) || (/\d/.test(stock) && Number(stock.replace(/[^0-9]/g, '')) === 0);

// 관리자가 넣은 수량 표. 이름이 비어 있는 줄은 버리고 길이는 화면에 맞게 자른다.
function fromSettings(value) {
  const items = Array.isArray(value?.items) ? value.items : [];
  return items.filter((item) => text(item?.name)).slice(0, MAX_ITEMS).map((item) => {
    const stock = text(item.stock).slice(0, 20);
    return { name: text(item.name).slice(0, 40), stock, soldOut: item.soldOut === true || emptied(stock) };
  });
}

// 수량을 마지막으로 고친 때. 'YYYY-MM-DD'만 날짜로 읽고 다른 표기는 적은 그대로 보여준다.
function updatedLabel(value) {
  const raw = text(value).replace(/[\r\n\t]/g, ' ').slice(0, 30).trim();
  if (!raw) return '';
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  return date ? `${Number(date[2])}월 ${Number(date[3])}일 기준` : `${raw} 기준`;
}

// 럭키드로우 남은 수량. 관리자 설정이 있으면 그걸 쓰고, 없거나 비면 웹에 적어둔 기본 목록을 그대로 쓴다.
export function rewardStock(event) {
  const value = event?.publicData?.luckyDraw;
  const items = fromSettings(value);
  if (!items.length) return { items: rewards.inventory.map((item) => ({ ...item, soldOut: false })), updatedLabel: '' };
  return { items, updatedLabel: updatedLabel(value?.updatedAt) };
}
