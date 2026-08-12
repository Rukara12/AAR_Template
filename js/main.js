/**
 * 진입점. 각 모듈을 화면에 붙이고 이벤트만 배선합니다.
 * 여기서는 로직을 두지 않습니다.
 */
import { state, subscribe, setMeta, newChapter, nextChapter,
         undoDelete, removeCard, patch, addCard } from './state.js';
import { setImageLoadHandler } from './canvas/layout.js';
import { THEMES, DEFAULT_THEME, setTheme } from './theme.js';
import { clearPreviewCache } from './ui/preview.js';
import { mountPalette } from './ui/palette.js';
import { mountCardList, renderCardList } from './ui/cardlist.js';
import { renderInspector, pasteTarget } from './ui/inspector.js';
import { isAdjusting } from './ui/imagebox.js';
import { isBusy, closeEditor } from './ui/direct.js';
import { renderStage, scrollToCard } from './ui/stage.js';
import { initUiScale, stepScale, resetScale } from './ui/uiscale.js';
import { openExportDialog } from './ui/exportdialog.js';
import { toast } from './ui/toast.js';
import { autosave, restore, exportProject, importProject } from './io/project.js';
import { readImageFile, firstImageFrom } from './io/files.js';

const $ = id => document.getElementById(id);

const el = {
  app: $('app'), ptiles: $('ptiles'), cardlist: $('cardlist'), rail: $('rail'),
  insp: $('insp'), inspBody: $('inspBody'), stage: $('stageInner'), stagemeta: $('stagemeta'),
  series: $('mSeries'), chapter: $('mChapter'), more: $('moreMenu'), theme: $('mTheme')
};

/* ── 출력 톤 ────────────────────────────────────────────── */
const THEME_KEY = 'aar-template/theme';

for (const [key, t] of Object.entries(THEMES)) {
  const o = document.createElement('option');
  o.value = key;
  o.textContent = t.label;
  el.theme.appendChild(o);
}

function applyTheme(key, persist = true) {
  setTheme(key);
  el.theme.value = key;
  clearPreviewCache();
  renderStage(el.stage, el.stagemeta);
  if (persist) { try { localStorage.setItem(THEME_KEY, key); } catch { /* noop */ } }
}

el.theme.addEventListener('change', () => applyTheme(el.theme.value));

/* ── 화면 갱신 ──────────────────────────────────────────── */
let lastSel = null;

function refresh() {
  renderCardList();

  // 글을 치거나 이미지를 맞추는 중에 폼을 다시 그리면 커서가 튑니다.
  const a = document.activeElement;
  const typing = el.insp.contains(a) && /^(INPUT|TEXTAREA)$/.test(a?.tagName);
  if (!typing && !isAdjusting() && !isBusy()) renderInspector(el.inspBody);

  renderStage(el.stage, el.stagemeta);
  syncMeta();

  if (state.selId && state.selId !== lastSel) {
    lastSel = state.selId;
    requestAnimationFrame(() => scrollToCard(state.selId));
  }
}

function syncMeta() {
  if (document.activeElement !== el.series)  el.series.value  = state.meta.series;
  // 회차는 연재일 때만 씁니다. 0 이면 빈 칸으로 둡니다.
  if (document.activeElement !== el.chapter) {
    el.chapter.value = +state.meta.chapter > 0 ? state.meta.chapter : '';
  }
}

/* ── 배선 ───────────────────────────────────────────────── */
mountPalette(el.ptiles, el.app);
mountCardList(el.cardlist, el.rail);
setImageLoadHandler(() => renderStage(el.stage, el.stagemeta));

initUiScale($('uiLevel'), () => renderStage(el.stage, el.stagemeta));
$('uiDown').addEventListener('click', () => stepScale(-1));
$('uiUp').addEventListener('click', () => stepScale(1));
$('uiLevel').addEventListener('click', resetScale);

subscribe(() => { refresh(); autosave(); });

el.series.addEventListener('input',  () => setMeta('series', el.series.value));
el.chapter.addEventListener('input', () => setMeta('chapter', +el.chapter.value || 0));

/* 회차 메뉴 */
const closeMenu = () => { el.more.hidden = true; };
$('btnMore').addEventListener('click', e => {
  e.stopPropagation();
  el.more.hidden = !el.more.hidden;
});
document.addEventListener('click', closeMenu);
el.more.addEventListener('click', e => e.stopPropagation());

$('btnNew').addEventListener('click', () => {
  closeMenu();
  if (state.cards.length && !confirm('현재 회차의 카드를 모두 비웁니다. 계속할까요?')) return;
  newChapter();
  toast('새 회차를 시작했습니다.');
});

$('btnNext').addEventListener('click', () => {
  closeMenu();
  nextChapter();
  toast(`${state.meta.chapter}화로 넘어갔습니다. 상황 요약·인물 카드는 남겨 뒀습니다.`, 3400);
});

$('btnSave').addEventListener('click', () => { closeMenu(); exportProject(); });

$('btnLoad').addEventListener('click', () => {
  closeMenu();
  const p = $('projPick');
  p.value = '';
  p.onchange = () => { if (p.files[0]) importProject(p.files[0]); };
  p.click();
});

$('btnExport').addEventListener('click', () => { closeEditor(); openExportDialog(); });

/* 카드 속성 패널 여닫기 */
$('btnPanel').addEventListener('click', () => {
  const off = document.body.classList.toggle('nopanel');
  $('btnPanel').classList.toggle('on', !off);
  try { localStorage.setItem('aar-template/panel', off ? '0' : '1'); } catch { /* noop */ }
});
try {
  if (localStorage.getItem('aar-template/panel') === '0') document.body.classList.add('nopanel');
} catch { /* noop */ }

/* ── 붙여넣기로 이미지 넣기 ─────────────────────────────── */
document.addEventListener('paste', async e => {
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
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
let savedTheme = null;
try { savedTheme = localStorage.getItem(THEME_KEY); } catch { /* noop */ }
applyTheme(THEMES[savedTheme] ? savedTheme : DEFAULT_THEME, false);

if (!restore()) {
  // 리뷰 한 편의 기본 뼈대
  ['cover', 'status', 'shot', 'text', 'score', 'proscons', 'verdict'].forEach(t => addCard(t));
  state.selId = state.cards[0].id;
}
refresh();

// 웹폰트가 늦게 오면 글자 위치가 달라지므로 다 불린 뒤 한 번 더 그립니다.
document.fonts?.ready.then(() => renderStage(el.stage, el.stagemeta));
