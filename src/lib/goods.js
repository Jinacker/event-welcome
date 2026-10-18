const text = (value) => typeof value === 'string' ? value.trim() : '';

// 관리자가 입력한 굿즈를 화면에서 쓸 형태로 정리한다. 이름이 없는 항목은 표시하지 않는다.
export function giftshopItems(event) {
  const items = Array.isArray(event?.giftshop?.items) ? event.giftshop.items : [];
  return items.filter((item) => text(item?.name)).map((item, order) => ({
    key: text(item.id) || `goods-${order}`,
    name: text(item.name),
    price: text(item.price),
    // 업로드된 https 사진과 목업용 같은 출처 경로만 쓴다.
    imageUrl: typeof item.imageUrl === 'string' && (item.imageUrl.startsWith('https://') || item.imageUrl.startsWith('/')) ? item.imageUrl : '',
    fit: item.fit === 'contain' ? 'contain' : 'cover',
    order,
  }));
}

export function giftshopNote(event) {
  return text(event?.giftshop?.note);
}

export function goodsPrice(price) {
  const digits = text(price).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : null;
}

export const GOODS_SORTS = [{ value: 'listed', label: '진열순' }, { value: 'low', label: '가격 낮은순' }, { value: 'high', label: '가격 높은순' }];

export function sortGoods(items, mode) {
  const list = [...items];
  if (mode !== 'low' && mode !== 'high') return list.sort((a, b) => a.order - b.order);
  const sign = mode === 'low' ? 1 : -1;
  return list.sort((a, b) => {
    const left = goodsPrice(a.price);
    const right = goodsPrice(b.price);
    // 가격을 적지 않은 굿즈는 진열 순서를 지키며 뒤로 보낸다.
    if (left === null || right === null) return left === right ? a.order - b.order : left === null ? 1 : -1;
    return left === right ? a.order - b.order : (left - right) * sign;
  });
}
