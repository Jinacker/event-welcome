const totalReactions = (note) => (
  (Number(note.viewCount) || 0)
  + (Number(note.likeCount) || 0)
  + (Number(note.commentCount) || 0)
);

const compareHotFeedStats = (left, right) => (
  totalReactions(right) - totalReactions(left)
  || (Number(right.viewCount) || 0) - (Number(left.viewCount) || 0)
  || (Number(right.likeCount) || 0) - (Number(left.likeCount) || 0)
  || (Number(right.commentCount) || 0) - (Number(left.commentCount) || 0)
);

/** 서버의 이번 주 TOP 10에서 무작위 4개를 고른 뒤 반응 합산 순으로 보여준다. */
export const selectHotFeedCards = (notes, random = Math.random, limit = 4) => {
  const shuffled = Array.isArray(notes) ? notes.slice(0, 10) : [];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, limit).sort(compareHotFeedStats);
};
