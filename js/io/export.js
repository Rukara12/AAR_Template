/** PNG 내보내기. 낱장과 세로 합본 두 가지. */
import { state } from '../state.js';
import { renderAll, mergePages } from '../canvas/render.js';
import { imagesReady } from '../canvas/layout.js';
import { downloadCanvas, safeName, sleep } from './files.js';
import { toast } from '../ui/toast.js';

const prefix = () => `${safeName(state.meta.series, '연재')}_${state.meta.chapter}화`;
const pad = (n, len) => String(n).padStart(String(len).length, '0');

/** 카드 한 장 = 이미지 한 장 */
export async function exportEach() {
  if (!state.cards.length) return toast('카드가 없습니다.');
  await imagesReady();
  const canvases = renderAll(state.cards);
  toast(`${canvases.length}장을 내려받습니다. 브라우저가 물어보면 허용해 주세요.`, 3400);
  for (let i = 0; i < canvases.length; i++) {
    await downloadCanvas(canvases[i], `${prefix()}_${pad(i + 1, canvases.length)}.png`);
    await sleep(320);
  }
  toast(`${canvases.length}장 저장 완료.`);
}

/** 여러 카드를 세로로 이어 붙인 긴 이미지 */
export async function exportMerged() {
  if (!state.cards.length) return toast('카드가 없습니다.');
  await imagesReady();
  const pages = mergePages(renderAll(state.cards), +state.meta.maxH || 6000);

  if (pages.length === 1) {
    await downloadCanvas(pages[0], `${prefix()}.png`);
    toast(`한 장으로 저장했습니다. (${pages[0].height.toLocaleString()}px)`);
    return;
  }

  toast(`높이 제한을 넘어 ${pages.length}장으로 나눕니다.`, 3200);
  for (let i = 0; i < pages.length; i++) {
    await downloadCanvas(pages[i], `${prefix()}_p${pad(i + 1, pages.length)}.png`);
    await sleep(320);
  }
  toast(`${pages.length}장 저장 완료.`);
}
