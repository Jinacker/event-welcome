import React from 'react';
export default function Seongbukcheon({ event }) {
  return <>
    <section className="hero"><p className="eyebrow">KATSU MAP · SEONGBUKCHEON</p><h1>성북천 따라<br />돈가스 한 바퀴</h1><p>성북천에서 만나는 돈가스 이야기.<br />맛있는 한 바퀴를 함께 준비하고 있어요.</p></section>
    <section className="intro-card"><span className="pill">이벤트 안내</span><h2>{event.title}</h2><p>{typeof event.publicData?.description === 'string' ? event.publicData.description : '참여 가게와 자세한 이벤트 안내는 곧 공개됩니다.'}</p></section>
    <section className="course-preview" aria-label="성북천 일러스트"><div className="river" /><span className="course-pin pin-one">🥩</span><span className="course-pin pin-two">🥩</span><span className="course-pin pin-three">🥩</span><span className="course-label">성북천에서 만나요</span></section>
  </>;
}
