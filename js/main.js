/**
 * 진입점. 각 모듈을 화면에 붙이고 이벤트만 배선합니다.
 * 여기서는 로직을 두지 않습니다.
 */
import { state, subscribe, setMeta, addCard, addCards, patch,
         removeCards, nudgeSelection, undo, redo, canUndo, canRedo } from './state.js';
import { setImageLoadHandler } from './canvas/layout.js';
import { THEMES, DEFAULT_THEME, setTheme } from './theme.js';
import { mountPalette } from './ui/palette.js';
import { mountCardList, renderCardList } from './ui/cardlist.js';
import { renderInspector, pasteTarget } from './ui/inspector.js';
import { isAdjusting } from './ui/imagebox.js';
import { isBusy, closeEditor } from './ui/direct.js';
import { renderStage, scrollToCard } from './ui/stage.js';
import { clearPreviewCache } from './ui/preview.js';
import { initUiScale, stepScale, resetScale } from './ui/uiscale.js';
import { openExportDialog } from './ui/exportdialog.js';
import { openStartDialog } from './ui/startdialog.js';
import { openLibraryDialog } from './ui/librarydialog.js';
import { openHelpDialog } from './ui/helpdialog.js';
import { isDialogOpen } from './ui/dialog.js';
import { toast } from './ui/toast.js';
import { autosave, restore, exportProject, importProject } from './io/project.js';
import { readImageFile, firstImageFrom, allImagesFrom } from './io/files.js';

const $ = id => document.getElementById(id);

const el = {
  app: $('app'), ptiles: $('ptiles'), cardlist: $('cardlist'), rail: $('rail'),
  insp: $('insp'), inspBody: $('inspBody'), stage: $('stageInner'),
  more: $('moreMenu'), theme: $('mTheme'), undo: $('btnUndo'), redo: $('btnRedo')
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
  renderStage(el.stage);
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

  renderStage(el.stage);

  el.undo.disabled = !canUndo();
  el.redo.disabled = !canRedo();

  if (state.selId && state.selId !== lastSel) {
    lastSel = state.selId;
    requestAnimationFrame(() => scrollToCard(state.selId));
  }
}

/* ── 배선 ───────────────────────────────────────────────── */
mountPalette(el.ptiles, el.app);
mountCardList(el.cardlist, el.rail);
setImageLoadHandler(() => renderStage(el.stage));

initUiScale($('uiLevel'), () => renderStage(el.stage));
$('uiDown').addEventListener('click', () => stepScale(-1));
$('uiUp').addEventListener('click', () => stepScale(1));
$('uiLevel').addEventListener('click', resetScale);

subscribe(() => { refresh(); autosave(); });

el.undo.addEventListener('click', () => { closeEditor(); undo(); });
el.redo.addEventListener('click', () => { closeEditor(); redo(); });

/* 문서 메뉴 */
const closeMenu = () => { el.more.hidden = true; };
$('btnMore').addEventListener('click', e => {
  e.stopPropagation();
  el.more.hidden = !el.more.hidden;
});
document.addEventListener('click', closeMenu);
el.more.addEventListener('click', e => e.stopPropagation());

const menu = (id, fn) => $(id).addEventListener('click', () => { closeMenu(); fn(); });

menu('btnNew', () => openStartDialog(() => toast('새로 시작했습니다.')));
menu('btnLibrary', openLibraryDialog);
menu('btnHelp', openHelpDialog);
menu('btnShots', () => pickImages(true));
menu('btnSave', exportProject);
menu('btnLoad', () => {
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

/* ── 이미지 넣기 ────────────────────────────────────────── */
/** 여러 장이면 그 수만큼 자막 스샷 카드를 만들어 한 번에 넣습니다. */
async function addShots(files) {
  const imgs = files.filter(f => f.type.startsWith('image/'));
  if (!imgs.length) return;

  toast(`이미지 ${imgs.length}장을 읽는 중…`, 1600);
  const urls = [];
  for (const f of imgs) {
    try { urls.push(await readImageFile(f)); } catch { /* 못 읽은 건 건너뜁니다 */ }
  }
  if (!urls.length) return toast('이미지를 읽지 못했습니다.');

  addCards(urls.map(u => ({ type: 'shot', props: { img: u } })));
  toast(`스샷 카드 ${urls.length}장을 넣었습니다.`);
}

function pickImages(multiple) {
  const p = $('filePick');
  p.value = '';
  p.multiple = !!multiple;
  p.onchange = () => { if (p.files.length) addShots([...p.files]); };
  p.click();
}

document.addEventListener('paste', async e => {
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
  const file = firstImageFrom(e.clipboardData);
  if (!file) return;
  e.preventDefault();
  if (!pasteTarget) return addShots([file]);
  try {
    patch(pasteTarget.cardId, pasteTarget.key, await readImageFile(file));
    toast('붙여넣었습니다.');
  } catch (err) {
    toast(err.message);
  }
});

document.addEventListener('dragover', e => {
  if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault();
});
document.addEventListener('drop', async e => {
  const files = allImagesFrom(e.dataTransfer);
  if (!files.length) return;
  e.preventDefault();

  // 한 장이고 넣을 자리가 정해져 있으면 그 칸에, 아니면 새 카드로.
  if (files.length === 1 && pasteTarget) {
    patch(pasteTarget.cardId, pasteTarget.key, await readImageFile(files[0]));
    return;
  }
  addShots(files);
});

/* ── 단축키 ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (isDialogOpen()) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  const mod = e.ctrlKey || e.metaKey;

  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    closeEditor();
    const ok = e.shiftKey ? redo() : undo();
    if (!ok) toast(e.shiftKey ? '다시할 것이 없습니다.' : '되돌릴 것이 없습니다.', 1400);
    return;
  }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); closeEditor(); redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); exportProject(); return; }

  if (typing) return;

  if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    nudgeSelection(e.key === 'ArrowUp' ? -1 : 1);
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selIds.length) {
    e.preventDefault();
    removeCards(state.selIds);
    return;
  }
  if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); openHelpDialog(); }
});

/* ── 시작 ───────────────────────────────────────────────── */
(async () => {
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch { /* noop */ }
  applyTheme(THEMES[savedTheme] ? savedTheme : DEFAULT_THEME, false);

  const restored = await restore();
  refresh();
  if (!restored) openStartDialog();

  // 웹폰트가 늦게 오면 글자 위치가 달라지므로 다 불린 뒤 한 번 더 그립니다.
  document.fonts?.ready.then(() => renderStage(el.stage));
})();
