/**
 * 내보내기 대화상자.
 * 형식·배율 같은 건 평소에 볼 일이 없으므로 저장을 누른 뒤에만 보여 줍니다.
 */
import { state, setMeta } from '../state.js';
import { exportEach, exportMerged } from '../io/export.js';
import { W } from '../canvas/layout.js';

let root = null;

const html = `
<div class="dlg-back"></div>
<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
  <h2 id="dlgTitle">내보내기</h2>

  <div class="dlg-field">
    <span class="dlg-label">저장 방식</span>
    <div class="seg" id="dlgMode">
      <button type="button" data-v="merge">세로 합본 한 장</button>
      <button type="button" data-v="each">카드마다 낱장</button>
    </div>
    <p class="hint" id="dlgModeHint"></p>
  </div>

  <div class="dlg-field">
    <span class="dlg-label">형식</span>
    <div class="seg" id="dlgFormat">
      <button type="button" data-v="webp">WebP</button>
      <button type="button" data-v="png">PNG</button>
    </div>
    <p class="hint">디시 PC 웹은 올린 이미지를 850px 로 강제 축소합니다. <b>WebP 는 그 처리를 통과</b>해 원본 화질이 그대로 올라갑니다.</p>
  </div>

  <div class="dlg-field">
    <span class="dlg-label">화질</span>
    <div class="seg" id="dlgScale">
      <button type="button" data-v="1">1배</button>
      <button type="button" data-v="2">2배</button>
      <button type="button" data-v="3">3배</button>
    </div>
    <p class="hint" id="dlgScaleHint"></p>
  </div>

  <div class="dlg-field" id="dlgMaxWrap">
    <span class="dlg-label">한 장 최대 높이</span>
    <input type="number" id="dlgMaxH" min="1000" step="500">
    <p class="hint">850px 기준입니다. 넘으면 카드 경계에서 여러 장으로 나눕니다.</p>
  </div>

  <div class="dlg-foot">
    <button type="button" class="ghost" id="dlgCancel">취소</button>
    <button type="button" class="primary" id="dlgGo">저장</button>
  </div>
</div>`;

function mount() {
  if (root) return root;
  root = document.createElement('div');
  root.className = 'dlg-wrap';
  root.hidden = true;
  root.innerHTML = html;
  document.body.appendChild(root);

  root.querySelector('.dlg-back').addEventListener('click', close);
  root.querySelector('#dlgCancel').addEventListener('click', close);
  root.querySelector('#dlgGo').addEventListener('click', run);

  seg('#dlgMode',   v => { state.meta.exportMode = v; sync(); });
  seg('#dlgFormat', v => { setMeta('format', v); sync(); });
  seg('#dlgScale',  v => { setMeta('outScale', +v); sync(); });
  root.querySelector('#dlgMaxH').addEventListener('input', e => setMeta('maxH', +e.target.value || 6000));

  document.addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') run();
  });
  return root;
}

function seg(sel, on) {
  root.querySelector(sel).addEventListener('click', e => {
    const v = e.target.dataset?.v;
    if (v) on(v);
  });
}

function paintSeg(sel, value) {
  for (const b of root.querySelectorAll(`${sel} button`)) {
    b.classList.toggle('on', b.dataset.v === String(value));
  }
}

function sync() {
  const m = state.meta;
  const mode = m.exportMode || 'merge';
  paintSeg('#dlgMode', mode);
  paintSeg('#dlgFormat', m.format || 'webp');
  paintSeg('#dlgScale', m.outScale || 2);
  root.querySelector('#dlgMaxH').value = m.maxH || 6000;
  root.querySelector('#dlgMaxWrap').hidden = mode !== 'merge';

  root.querySelector('#dlgModeHint').textContent = mode === 'merge'
    ? '순서가 꼬일 일이 없고 첨부 개수도 아낍니다. 대부분 이쪽이 편합니다.'
    : `카드 하나가 이미지 하나로. 지금 ${state.cards.length}장입니다. (글당 50장 제한)`;

  const px = Math.round(W * (m.outScale || 2));
  root.querySelector('#dlgScaleHint').textContent =
    `가로 ${px}px 로 저장합니다.` + ((m.outScale || 2) > 1 && m.format === 'png'
      ? ' PNG 는 850px 로 축소되니 WebP 를 권합니다.' : '');
}

export function openExportDialog() {
  mount();
  sync();
  root.hidden = false;
  root.querySelector('#dlgGo').focus();
}

function close() { if (root) root.hidden = true; }

async function run() {
  close();
  if ((state.meta.exportMode || 'merge') === 'merge') await exportMerged();
  else await exportEach();
}
