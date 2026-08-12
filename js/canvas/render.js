/**
 * 카드 → 캔버스 변환과 합본 묶기.
 * 카드별 그리기 로직은 js/cards/*.js 안에 있고, 여기서는 배치만 합니다.
 */
import { T } from '../theme.js';
import { W } from './layout.js';
import { BY_ID } from '../cards/registry.js';

/**
 * 한 장의 최대 높이.
 * WebP 는 한 변이 16383px 를 넘으면 아예 인코딩에 실패하므로 그 아래로 잡습니다.
 * 출력 배율을 3배로 올리면 이 값에 훨씬 빨리 닿습니다.
 */
export const MAX_CANVAS_H = 16000;

/** 850px 좌표계로 그릴 캔버스를 준비합니다. ss 는 화면용 오버샘플링 배율입니다. */
function prepare(cv, h, ss) {
  cv.width = Math.round(W * ss);
  cv.height = Math.round(h * ss);
  cv.logicalHeight = h;            // 화면에 몇 px 로 보여야 하는지
  const ctx = cv.getContext('2d');
  ctx.setTransform(ss, 0, 0, ss, 0, 0);   // 카드 코드는 항상 850px 기준으로 그립니다
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, h);
  ctx.textBaseline = 'alphabetic';
  return ctx;
}

function errorCard(cv, ss, msg) {
  const ctx = prepare(cv, 80, ss);
  ctx.fillStyle = T.panel;
  ctx.fillRect(0, 0, W, 80);
  ctx.fillStyle = T.bad;
  ctx.font = `400 16px ${T.sans}`;
  ctx.fillText(msg, 24, 46);
  cv.zones = [];
  return cv;
}

/**
 * 이미 있는 캔버스에 카드를 다시 그립니다.
 * 미리보기는 요소를 새로 만들지 않고 이 함수로 갱신해서,
 * 그 위에 떠 있는 글 편집칸이 사라지지 않게 합니다.
 *
 * @param ss 미리보기용 오버샘플링 배율. 내보내기는 항상 1 (= 정확히 850px)
 * @returns 같은 캔버스. logicalHeight 와 zones(편집 영역) 가 붙어 있습니다.
 */
export function renderInto(cv, card, ss = 1) {
  const def = BY_ID[card.type];
  if (!def) return errorCard(cv, ss, `알 수 없는 카드 타입: ${card.type}`);

  let block;
  try {
    block = def.build(card);
  } catch (err) {
    console.error(`[${card.type}] 렌더 실패`, err);
    return errorCard(cv, ss, `${def.name} 카드를 그리지 못했습니다: ${err.message}`);
  }

  const h = Math.max(40, Math.min(MAX_CANVAS_H, Math.round(block.h)));
  const ctx = prepare(cv, h, ss);
  block.paint(ctx);
  cv.zones = block.zones || [];
  return cv;
}

export const renderCard = (card, ss = 1) => renderInto(document.createElement('canvas'), card, ss);
export const renderAll = (cards, ss = 1) => cards.map(c => renderCard(c, ss));

/**
 * 카드 캔버스들을 세로로 이어 붙입니다. (내보내기 전용 — ss 가 1 인 캔버스를 넣어야 합니다)
 * maxH 를 넘으면 카드 경계에서 잘라 여러 장으로 나눕니다. 카드 중간은 자르지 않습니다.
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
