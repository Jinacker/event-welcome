// 가게 이름 표기 차이를 흡수한다. 공백과 돈까스/돈가스 표기만 맞춘다.
const key = (name) => typeof name === 'string' ? name.replace(/\s+/g, '').replace(/까스/g, '가스') : '';

// 정해둔 순서에서 이 가게의 자리. 지점명이 붙거나 빠진 경우도 앞부분이 같으면 같은 가게로 본다.
function rankOf(name, entries) {
  const target = key(name);
  if (!target) return Infinity;
  const exact = entries.find(([value]) => value === target);
  if (exact) return exact[1];
  const partial = entries.find(([value]) => value.startsWith(target) || target.startsWith(value));
  return partial ? partial[1] : Infinity;
}

// 정해둔 순서대로 가게를 정렬한다. 순서에 없는 가게도 빠지지 않고 원래 순서를 지키며 뒤에 남는다.
export function sortStores(restaurants, order) {
  const list = Array.isArray(restaurants) ? restaurants : [];
  const entries = (Array.isArray(order) ? order : []).map((name, index) => [key(name), index]).filter(([value]) => value);
  if (!entries.length) return list;
  return list
    .map((item, index) => ({ item, index, rank: rankOf(item?.name, entries) }))
    .sort((left, right) => left.rank === right.rank ? left.index - right.index : left.rank - right.rank)
    .map((entry) => entry.item);
}
