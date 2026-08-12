/**
 * 팔레트 타일에 커서를 올렸을 때 뜨는 견본.
 *
 * 견본 내용은 카드의 기본값과 필드 스키마의 예시 문구(ph)로 자동으로 만들기 때문에,
 * 카드를 새로 추가해도 여기를 고칠 필요가 없습니다.
 *
 * 선명도가 핵심입니다. 크게 그린 뒤 CSS 로 줄이면 브라우저 축소 필터를 타서 뭉개지므로,
 * 화면에 찍힐 실제 픽셀 수만큼만 그립니다. 배치는 850px 기준 그대로 두고
 * 래스터화 배율만 바꾸므로 줄바꿈은 실제 결과와 똑같습니다.
 */
import { renderCard } from '../canvas/render.js';
import { W } from '../canvas/layout.js';
import { currentScale } from './uiscale.js';

const IDEAL_W = 860;   // 여유가 되면 원래 크기(850px)로 보여 줍니다
const MIN_W   = 420;
const DELAY   = 170;

const cache = new Map();   // `${id}@${표시폭}` → canvas
let pop = null, timer = null;

/** 예시 문구를 채워 넣은 견본 카드를 만듭니다. */
function demoCard(def) {
  const c = { id: 'demo', type: def.id, ...structuredClone(def.create()) };

  for (const f of def.fields) {
    if (!f.k) continue;
    const v = c[f.k];

    if ((f.t === 'text' || f.t === 'textarea') && !v && f.ph) c[f.k] = f.ph;

    if (f.t === 'strlist' && Array.isArray(v) && v.every(x => !x)) {
      c[f.k] = [f.ph || '첫 번째 항목', '두 번째 항목', '세 번째 항목'].slice(0, Math.max(2, v.length));
    }

    if (f.t === 'pairs' && Array.isArray(v) && v.every(p => !p.l)) {
      c[f.k] = f.numeric
        ? [{ l: '그래픽', v: '8' }, { l: '재미', v: '9' }]
        : [{ l: '장르', v: '액션 RPG' }, { l: '가격', v: '32,000원' }];
    }
  }
  return c;
}

/**
 * @param maxW 팝업이 쓸 수 있는 가로
 * @param maxH 팝업이 쓸 수 있는 세로
 */
function canvasFor(def, maxW, maxH) {
  const card = demoCard(def);

  // 그리기 전에 높이만 재서 표시 배율을 정합니다.
  let logicalH = 400;
  try { logicalH = Math.max(40, Math.round(def.build(card).h)); } catch { /* 기본값 사용 */ }

  const fit = Math.min(maxW / W, maxH / logicalH, 1);
  const showW = Math.round(W * fit);

  const key = `${def.id}@${showW}`;
  if (cache.has(key)) return cache.get(key);

  // 화면에 실제로 찍히는 픽셀 밀도. zoom 이 걸려 있으면 그만큼 더 촘촘해야 합니다.
  const dpr = Math.min(3, (globalThis.devicePixelRatio || 1) * currentScale());

  const cv = renderCard(card, fit * dpr);
  cv.style.width  = `${showW}px`;
  cv.style.height = `${Math.round(logicalH * fit)}px`;

  cache.set(key, cv);
  return cv;
}

function ensurePop(host) {
  if (pop) return pop;
  pop = document.createElement('div');
  pop.className = 'cardpop';
  pop.hidden = true;
  pop.innerHTML = `<div class="cardpop-head"><b></b><span></span></div><div class="cardpop-body"></div>`;
  host.appendChild(pop);
  return pop;
}

export function showPreview(def, tile, host) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const p = ensurePop(host);
    const a = host.getBoundingClientRect();
    const r = tile.getBoundingClientRect();

    // 타일 오른쪽부터 화면 끝까지가 쓸 수 있는 공간입니다.
    const left  = r.right - a.left + 12;
    const maxW  = Math.max(MIN_W, Math.min(IDEAL_W, a.width - left - 22));
    const maxH  = Math.max(260, a.height - 46);

    p.querySelector('b').textContent = def.name;
    p.querySelector('span').textContent = def.desc;
    const body = p.querySelector('.cardpop-body');
    body.innerHTML = '';
    body.appendChild(canvasFor(def, maxW, maxH));
    p.hidden = false;

    // 배율(zoom)이 걸려 있어도 두 사각형이 같은 좌표계라 그대로 뺄 수 있습니다.
    const h = p.offsetHeight;
    p.style.left = `${left}px`;
    p.style.top  = `${Math.max(8, Math.min(r.top - a.top - 10, a.height - h - 8))}px`;
  }, DELAY);
}

export function hidePreview() {
  clearTimeout(timer);
  if (pop) pop.hidden = true;
}

/** 톤이나 카드 정의가 바뀌면 견본을 새로 그리게 합니다. */
export function clearPreviewCache() { cache.clear(); }
