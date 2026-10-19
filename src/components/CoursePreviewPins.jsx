import React, { useId } from 'react';

// map_event.html의 핀 SVG·바탕색·이모지를 미리보기의 흰 원 안에 담는다.
const OUTER_PIN = 'M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z';
const PINS = [
  { x: 77, y: 48, walking: false },
  { x: 175, y: 130, walking: true },
  { x: 280, y: 64, walking: false },
];
const FRAME_RADIUS = 16;
const ARROW_HEAD_LENGTH = 8;

// 곡선의 양 끝을 핀이 담긴 흰 원의 바깥 테두리에 맞춘다.
function curvePoints(startBody, targetBody) {
  const radius = FRAME_RADIUS + .5;
  const bodyEdge = (body, toward) => {
    const dx = toward.x - body.x;
    const dy = toward.y - body.y;
    const distance = Math.hypot(dx, dy);
    return distance > 0
      ? { x: body.x + dx / distance * radius, y: body.y + dy / distance * radius }
      : { x: body.x + radius, y: body.y };
  };
  const from = bodyEdge(startBody, targetBody);
  const targetEdge = bodyEdge(targetBody, startBody);
  // 몸통은 화살촉의 밑면에서 끝나고, 화살촉 끝만 원 테두리에 닿게 한다.
  const to = {
    x: targetEdge.x + (targetEdge.x - targetBody.x) / radius * ARROW_HEAD_LENGTH,
    y: targetEdge.y + (targetEdge.y - targetBody.y) / radius * ARROW_HEAD_LENGTH,
  };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const handle = Math.min(56, distance * .24);
  const bend = Math.min(22, distance * .08);
  const upward = dx >= 0 ? -1 : 1;
  const control1 = {
    x: from.x + (from.x - startBody.x) / radius * handle - dy / Math.max(distance, 1) * bend * upward,
    y: from.y + (from.y - startBody.y) / radius * handle + dx / Math.max(distance, 1) * bend * upward,
  };
  const control2 = {
    x: to.x + (targetEdge.x - targetBody.x) / radius * handle,
    y: to.y + (targetEdge.y - targetBody.y) / radius * handle,
  };
  const segments = 64;
  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    const u = 1 - t;
    return `${u ** 3 * from.x + 3 * u ** 2 * t * control1.x + 3 * u * t ** 2 * control2.x + t ** 3 * to.x},${u ** 3 * from.y + 3 * u ** 2 * t * control1.y + 3 * u * t ** 2 * control2.y + t ** 3 * to.y}`;
  }).join(' ');
}

export default function CoursePreviewPins() {
  const markerId = `course-preview-arrow-${useId().replace(/:/g, '')}`;

  return <svg className="course-preview-pins" viewBox="0 0 350 200" aria-hidden="true">
    <defs><marker id={markerId} viewBox="0 0 8 8" refX="0" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0 0 8 4 0 8Z" fill="#1E3C62" />
    </marker></defs>
    <polyline className="course-preview-route" points={curvePoints(PINS[2], PINS[1])} markerEnd={`url(#${markerId})`} />
    <polyline className="course-preview-route" points={curvePoints(PINS[1], PINS[0])} markerEnd={`url(#${markerId})`} />
    {PINS.map((pin, index) => <g key={index}>
      <circle className="course-preview-pin-frame" cx={pin.x} cy={pin.y} r={FRAME_RADIUS} />
      <svg x={pin.x - 12} y={pin.y - 15} width="24" height="30" viewBox="0 0 256 256">
        <path d={OUTER_PIN} fill={pin.walking ? '#B2DEE8' : '#1E3C62'} stroke="#F5F0E8" strokeWidth="6" />
        <text x="126" y="110" textAnchor="middle" dominantBaseline="middle" fontSize="102" fontFamily="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">{pin.walking ? '🦆' : '🕵🏻‍♂️'}</text>
      </svg>
    </g>)}
  </svg>;
}
