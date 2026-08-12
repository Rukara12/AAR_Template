/**
 * 진입점. 각 모듈을 화면에 붙이고 이벤트만 배선합니다.
 * 여기서는 로직을 두지 않습니다.
 */
import { state, subscribe, setMeta, newChapter, nextChapter,
         undoDelete, removeCard, patch, addCard } from './state.js';
import { setImageLoadHandler } from './canvas/layout.js';
import { mountPalette } from './ui/palette.js';
import { mountCardList, renderCardList } from './ui/cardlist.js';
import { renderInspector, pasteTarget } from './ui/inspector.js';
import { renderStage } from './ui/stage.js';
import { toast } from './ui/toast.js';
import { exportEach, exportMerged } from './io/export.js';
import { autosave, restore, exportProject, importProject } from './io/project.js';
import { readImageFile, firstImageFrom } from './io/files.js';

const $ = id => document.getElementById(id);

const el = {
  ptiles: $('ptiles'), cardlist: $('cardlist'), rail: $('rail'),
  insp: $('inspBody'), stage: $('stageInner'), stagemeta: $('stagemeta'),
  series: $('mSeries'), chapter: $('mChapter'), game: $('mGame'), maxH: $('mMaxH')
};

/* ── 화면 갱신 ──────────────────────────────────────────── */
function refresh() {
  renderCardList();
  // 글자를 치는 도중에 폼을 다시 그리면 커서가 튀므로, 입력 중에는 건너뜁니다.
  const a = document.activeElement;
  const typingInForm = el.insp.contains(a) && /^(INPUT|TEXTAREA)$/.test(a?.tagName);
  if (!typingInForm) renderInspector(el.insp);
  renderStage(el.stage, el.stagemeta);
  syncMeta();
}

function syncMeta() {
  if (document.activeElement !== el.series)  el.series.value  = state.meta.series;
  if (document.activeElement !== el.chapter) el.chapter.value = state.meta.chapter;
  if (document.activeElement !== el.game)    el.game.value    = state.meta.game;
  if (document.activeElement !== el.maxH)    el.maxH.value    = state.meta.maxH;
}

/* ── 배선 ───────────────────────────────────────────────── */
mountPalette(el.ptiles);
mountCardList(el.cardlist, el.rail);
setImageLoadHandler(() => renderStage(el.stage, el.stagemeta));

subscribe(() => { refresh(); autosave(); });

el.series.addEventListener('input',  () => setMeta('series', el.series.value));
el.game.addEventListener('input',    () => setMeta('game', el.game.value));
el.chapter.addEventListener('input', () => setMeta('chapter', +el.chapter.value || 0));
el.maxH.addEventListener('input',    () => setMeta('maxH', +el.maxH.value || 6000));

$('btnNew').addEventListener('click', () => {
  if (state.cards.length && !confirm('현재 회차의 카드를 모두 비웁니다. 계속할까요?')) return;
  newChapter();
  toast('새 회차를 시작했습니다.');
});

$('btnNext').addEventListener('click', () => {
  nextChapter();
  toast(`${state.meta.chapter}화로 넘어갔습니다. 상황 요약·인물 카드는 그대로 남겨 뒀습니다.`, 3200);
});

$('btnSave').addEventListener('click', exportProject);

$('btnLoad').addEventListener('click', () => {
  const p = $('projPick');
  p.value = '';
  p.onchange = () => { if (p.files[0]) importProject(p.files[0]); };
  p.click();
});

$('btnEach').addEventListener('click', exportEach);
$('btnMerge').addEventListener('click', exportMerged);

/* ── 붙여넣기로 이미지 넣기 ─────────────────────────────── */
document.addEventListener('paste', async e => {
  const t = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (t) return;
  const file = firstImageFrom(e.clipboardData);
  if (!file) return;
  if (!pasteTarget) return toast('이미지를 넣을 카드를 먼저 골라 주세요.');
  e.preventDefault();
  try {
    patch(pasteTarget.cardId, pasteTarget.key, await readImageFile(file));
    toast('붙여넣었습니다.');
  } catch (err) {
    toast(err.message);
  }
});

/* ── 창 전체에 이미지를 떨어뜨렸을 때 ───────────────────── */
document.addEventListener('dragover', e => {
  if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault();
});
document.addEventListener('drop', async e => {
  const file = firstImageFrom(e.dataTransfer);
  if (!file) return;
  e.preventDefault();
  if (!pasteTarget) {
    // 고른 카드가 없으면 자막 스샷 카드를 새로 만들어 넣습니다.
    const card = addCard('shot');
    patch(card.id, 'img', await readImageFile(file));
    toast('스샷 카드를 새로 만들었습니다.');
    return;
  }
  patch(pasteTarget.cardId, pasteTarget.key, await readImageFile(file));
});

/* ── 단축키 ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
    if (undoDelete()) { e.preventDefault(); toast('되살렸습니다.'); }
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && state.selId) {
    e.preventDefault();
    removeCard(state.selId);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    exportProject();
  }
});

/* ── 시작 ───────────────────────────────────────────────── */
if (!restore()) {
  state.meta.series = '';
  ['cover', 'status', 'shot', 'dialogue', 'choice'].forEach(t => addCard(t));
  state.selId = state.cards[0].id;
}
refresh();

// 웹폰트가 늦게 오면 글자 위치가 달라지므로 다 불린 뒤 한 번 더 그립니다.
if (document.fonts?.ready) {
  document.fonts.ready.then(() => renderStage(el.stage, el.stagemeta));
}
