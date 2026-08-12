/** 이미지 내보내기. 낱장과 세로 합본 두 가지. */
import { state } from '../state.js';
import { renderAll, mergePages } from '../canvas/render.js';
import { imagesReady, W } from '../canvas/layout.js';
import { downloadCanvas, safeName, sleep } from './files.js';
import { toast } from '../ui/toast.js';

/** 디시 첨부 한 장 상한 */
const LIMIT_MB = 20;

/** 회차를 비워 두면 제목만 씁니다. (단일 리뷰) */
const prefix = () => {
  const t = safeName(state.meta.series, '리뷰');
  const n = +state.meta.chapter;
  return n > 0 ? `${t}_${n}화` : t;
};
const pad = (n, len) => String(n).padStart(String(len).length, '0');
const scale = () => Math.max(1, Math.min(4, +state.meta.outScale || 2));
const format = () => (state.meta.format === 'png' ? 'png' : 'webp');
const mb = b => (b / 1024 / 1024).toFixed(1);

function report(sizes) {
  const big = sizes.filter(s => s / 1024 / 1024 > LIMIT_MB).length;
  const total = sizes.reduce((a, b) => a + b, 0);
  const n = sizes.length;
  if (big) {
    toast(`${n}장 저장 완료 — 다만 ${big}장이 ${LIMIT_MB}MB 를 넘습니다. 출력 배율을 낮춰 주세요.`, 5200);
  } else {
    toast(`${n}장 저장 완료 · 합계 ${mb(total)}MB · 가로 ${Math.round(W * scale())}px`, 3600);
  }
}

/** 카드 한 장 = 이미지 한 장 */
export async function exportEach() {
  if (!state.cards.length) return toast('카드가 없습니다.');
  await imagesReady();
  const canvases = renderAll(state.cards, scale());
  toast(`${canvases.length}장을 내려받습니다. 브라우저가 물어보면 허용해 주세요.`, 3400);

  const sizes = [];
  for (let i = 0; i < canvases.length; i++) {
    sizes.push(await downloadCanvas(canvases[i], `${prefix()}_${pad(i + 1, canvases.length)}`, format()));
    await sleep(320);
  }
  report(sizes);
}

/** 여러 카드를 세로로 이어 붙인 긴 이미지 */
export async function exportMerged() {
  if (!state.cards.length) return toast('카드가 없습니다.');
  await imagesReady();
  const s = scale();
  const pages = mergePages(renderAll(state.cards, s), (+state.meta.maxH || 6000) * s);

  if (pages.length > 1) toast(`높이 제한을 넘어 ${pages.length}장으로 나눕니다.`, 3200);

  const sizes = [];
  for (let i = 0; i < pages.length; i++) {
    const name = pages.length === 1 ? prefix() : `${prefix()}_p${pad(i + 1, pages.length)}`;
    sizes.push(await downloadCanvas(pages[i], name, format()));
    await sleep(320);
  }
  report(sizes);
}
