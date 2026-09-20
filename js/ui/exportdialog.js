/**
 * 내보내기 대화상자.
 * 형식·화질 같은 건 평소에 볼 일이 없으므로 내보내기를 누른 뒤에만 보여 줍니다.
 */
import { state, setMeta } from '../state.js';
import { exportEach, exportMerged } from '../io/export.js';
import { renderAll, mergePages } from '../canvas/render.js';
import { W } from '../canvas/layout.js';
import { showDialog } from './dialog.js';

export function openExportDialog() {
  showDialog({
    title: '내보내기',
    ok: '저장',
    cancel: '취소',
    html: `
      <div class="dlg-field">
        <span class="dlg-label">저장 방식</span>
        <div class="seg" data-seg="exportMode">
          <button type="button" data-v="merge">세로 합본 한 장</button>
          <button type="button" data-v="each">카드마다 낱장</button>
        </div>
        <p class="hint" id="dlgModeHint"></p>
      </div>

      <div class="dlg-field">
        <span class="dlg-label">형식</span>
        <div class="seg" data-seg="format">
          <button type="button" data-v="webp">WebP</button>
          <button type="button" data-v="png">PNG</button>
        </div>
        <p class="hint">디시 PC 웹은 올린 이미지를 850px 로 강제 축소합니다.
        <b>WebP 는 그 처리를 통과</b>해 원본 화질이 그대로 올라갑니다.</p>
      </div>

      <div class="dlg-field">
        <span class="dlg-label">화질</span>
        <div class="seg" data-seg="outScale">
          <button type="button" data-v="1">1배</button>
          <button type="button" data-v="2">2배</button>
          <button type="button" data-v="3">3배</button>
        </div>
      </div>

      <div class="dlg-field" id="dlgMaxWrap">
        <span class="dlg-label">한 장 최대 높이 (850px 기준)</span>
        <input type="number" id="dlgMaxH" min="1000" step="500">
      </div>

      <div class="dlg-sum" id="dlgSum"></div>`,

    onMount(dlg) {
      const paint = () => {
        for (const seg of dlg.querySelectorAll('[data-seg]')) {
          const key = seg.dataset.seg;
          for (const b of seg.querySelectorAll('button')) {
            b.classList.toggle('on', b.dataset.v === String(state.meta[key]));
          }
        }
        const merge = state.meta.exportMode === 'merge';
        dlg.querySelector('#dlgMaxWrap').hidden = !merge;
        dlg.querySelector('#dlgMaxH').value = state.meta.maxH || 6000;
        dlg.querySelector('#dlgModeHint').textContent = merge
          ? '순서가 꼬일 일이 없고 첨부 개수도 아낍니다. 대부분 이쪽이 편합니다.'
          : `카드 하나가 이미지 하나로. 지금 ${state.cards.length}장입니다. (글당 50장 제한)`;
        summarize(dlg);
      };

      for (const seg of dlg.querySelectorAll('[data-seg]')) {
        seg.addEventListener('click', e => {
          const v = e.target.dataset?.v;
          if (!v) return;
          const key = seg.dataset.seg;
          setMeta(key, key === 'outScale' ? +v : v);
          paint();
        });
      }
      dlg.querySelector('#dlgMaxH').addEventListener('input', e => {
        setMeta('maxH', +e.target.value || 6000);
        summarize(dlg);
      });

      paint();
    },

    async onOk() {
      if (state.meta.exportMode === 'each') await exportEach();
      else await exportMerged();
    }
  });
}

/** 저장하기 전에 몇 장이 몇 px 로 나올지 미리 계산해 보여 줍니다. */
let busy = false;
function summarize(dlg) {
  const box = dlg.querySelector('#dlgSum');
  if (!box || busy) return;
  busy = true;

  requestAnimationFrame(() => {
    busy = false;
    const s = Math.max(1, Math.min(4, +state.meta.outScale || 2));
    const px = Math.round(W * s);

    if (!state.cards.length) { box.textContent = '카드가 없습니다.'; return; }

    if (state.meta.exportMode === 'each') {
      box.innerHTML = `<b>${state.cards.length}장</b> · 가로 ${px}px · ${String(state.meta.format).toUpperCase()}`;
      return;
    }

    // 합본은 몇 장으로 나뉘는지가 중요하므로 실제로 계산합니다.
    try {
      const pages = mergePages(renderAll(state.cards, s), (+state.meta.maxH || 6000) * s);
      const tall = pages.map(p => p.height.toLocaleString()).join(' · ');
      box.innerHTML = `<b>${pages.length}장</b> · 가로 ${px}px · 세로 ${tall}px · ${String(state.meta.format).toUpperCase()}`;
    } catch {
      box.textContent = '';
    }
  });
}
