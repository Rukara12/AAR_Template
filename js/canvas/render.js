/**
 * 카드 → 캔버스 변환과 합본 묶기.
 * 카드별 그리기 로직은 js/cards/*.js 안에 있고, 여기서는 배치만 합니다.
 */
import { T } from '../theme.js';
import { W } from './layout.js';
import { BY_ID } from '../cards/registry.js';

/** 브라우저 캔버스 한 변의 안전 상한 */
export const MAX_CANVAS_H = 16000;

/** 카드 하나를 850px 폭 캔버스로 그립니다. */
export function renderCard(card) {
  const def = BY_ID[card.type];
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');

  if (!def) {
    cv.width = W; cv.height = 80;
    ctx.fillStyle = T.panel; ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = T.bad; ctx.font = `400 16px ${T.sans}`;
    ctx.fillText(`알 수 없는 카드 타입: ${card.type}`, 20, 46);
    return cv;
  }

  let block;
  try {
    block = def.build(card);
  } catch (err) {
    console.error(`[${card.type}] 렌더 실패`, err);
    cv.width = W; cv.height = 80;
    ctx.fillStyle = T.panel; ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = T.bad; ctx.font = `400 15px ${T.sans}`;
    ctx.fillText(`${def.name} 카드를 그리지 못했습니다: ${err.message}`, 20, 46);
    return cv;
  }

  const h = Math.max(40, Math.min(MAX_CANVAS_H, Math.round(block.h)));
  cv.width = W;
  cv.height = h;
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, h);
  ctx.textBaseline = 'alphabetic';
  block.paint(ctx);
  return cv;
}

export const renderAll = cards => cards.map(renderCard);

/**
 * 카드 캔버스들을 세로로 이어 붙입니다.
 * maxH 를 넘으면 카드 경계에서 잘라 여러 장으로 나눕니다. (카드 중간은 절대 자르지 않음)
 */
export function mergePages(canvases, maxH = 6000) {
  const limit = Math.max(600, Math.min(MAX_CANVAS_H, maxH));
  const pages = [];
  let group = [], gh = 0;

  for (const cv of canvases) {
    if (group.length && gh + cv.height > limit) { pages.push(group); group = []; gh = 0; }
    group.push(cv);
    gh += cv.height;
  }
  if (group.length) pages.push(group);

  return pages.map(group => {
    const total = group.reduce((a, c) => a + c.height, 0);
    const out = document.createElement('canvas');
    out.width = W;
    out.height = Math.min(MAX_CANVAS_H, total);
    const ctx = out.getContext('2d');
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, out.width, out.height);
    let y = 0;
    for (const c of group) { ctx.drawImage(c, 0, y); y += c.height; }
    return out;
  });
}
