/**
 * 미리보기에서 바로 고치기.
 *
 * 카드가 build() 에서 알려 준 zones 를 화면 좌표로 옮겨서
 *  · 글 영역을 누르면 그 자리에 입력칸을 띄우고
 *  · 이미지 영역은 끌어서 옮기고 휠로 확대합니다.
 * 카드마다 따로 손댈 필요 없이, zones 만 있으면 그대로 동작합니다.
 */
import { W, imgOf, isReady } from '../canvas/layout.js';
import { BY_ID } from '../cards/registry.js';
import { state, patch, select } from '../state.js';

/** 편집 중일 때는 미리보기를 다시 만들지 않고 그림만 갱신합니다. */
let editing = null;   // { cardId, zone, ta, wrap }
let dragging = false;
export const isBusy = () => !!editing || dragging;

/* ── 값 읽고 쓰기 (목록형 필드까지) ─────────────────────── */
function getValue(card, z) {
  if (z.index == null) return card[z.k] ?? '';
  const item = (card[z.k] || [])[z.index];
  return (z.sub ? item?.[z.sub] : item) ?? '';
}
function setValue(card, z, val) {
  if (z.index == null) return patch(card.id, z.k, val);
  const arr = [...(card[z.k] || [])];
  arr[z.index] = z.sub ? { ...arr[z.index], [z.sub]: val } : val;
  patch(card.id, z.k, arr);
}
const hintOf = (card, z) =>
  BY_ID[card.type]?.fields.find(f => f.k === z.k)?.ph || '내용을 입력하세요';

/* ── 좌표 변환 ──────────────────────────────────────────── */
const scaleOf = cv => (cv.clientWidth || W) / W;

function hit(zones, zx, zy) {
  // 뒤에 그려진 것(위에 있는 것)을 먼저 봅니다.
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (zx >= z.x && zx <= z.x + z.w && zy >= z.y && zy <= z.y + z.h) return z;
  }
  return null;
}

function localPoint(cv, e) {
  const r = cv.getBoundingClientRect();
  const s = scaleOf(cv);
  return { zx: (e.clientX - r.left) / s, zy: (e.clientY - r.top) / s, s };
}

/** 입력칸 배경을 카드에서 직접 뽑아 씁니다. 카드마다 배경색이 달라서요. */
function sampleBg(cv, z) {
  try {
    const ss = cv.width / W;
    const x = Math.max(0, Math.min(cv.width - 1, Math.round((z.x + 3) * ss)));
    const y = Math.max(0, Math.min(cv.height - 1, Math.round((z.y + 3) * ss)));
    const d = cv.getContext('2d').getImageData(x, y, 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  } catch {
    return '#1a1712';
  }
}

/* ── 글 편집칸 ──────────────────────────────────────────── */
export function closeEditor(commit = true) {
  if (!editing) return;
  const { ta, cardId, zone } = editing;
  const card = state.cards.find(c => c.id === cardId);
  editing = null;
  if (commit && card) setValue(card, zone, ta.value);
  ta.remove();
}

function openEditor(wrap, cv, card, z) {
  closeEditor();
  select(card.id);

  const ta = document.createElement('textarea');
  ta.className = 'zedit';
  ta.value = getValue(card, z);
  ta.placeholder = hintOf(card, z);
  ta.rows = 1;
  ta.spellcheck = false;

  editing = { cardId: card.id, zone: z, ta, wrap };
  wrap.appendChild(ta);
  place(ta, cv, z);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  let timer = null;
  ta.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const c = state.cards.find(x => x.id === card.id);
      if (c) setValue(c, z, ta.value);
    }, 130);
  });

  ta.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { closeEditor(false); cv.focus(); }
    if (e.key === 'Enter' && !e.shiftKey && !z.multiline) { e.preventDefault(); closeEditor(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); closeEditor(); }
  });
  ta.addEventListener('blur', () => closeEditor());
  ta.addEventListener('wheel', e => e.stopPropagation());
}

function place(ta, cv, z) {
  const s = scaleOf(cv);
  Object.assign(ta.style, {
    left:       `${z.x * s}px`,
    top:        `${z.y * s}px`,
    width:      `${z.w * s}px`,
    minHeight:  `${z.h * s}px`,
    fontSize:   `${z.size * s}px`,
    lineHeight: `${z.lh * s}px`,
    fontFamily: z.family,
    fontWeight: String(z.weight || 400),
    color:      z.color,
    textAlign:  z.align || 'left',
    background: z.bg || sampleBg(cv, z)
  });
  ta.style.height = 'auto';
  ta.style.height = `${Math.max(z.h * s, ta.scrollHeight)}px`;
}

/** 미리보기를 다시 그린 뒤, 열려 있는 입력칸을 새 위치로 옮깁니다. */
export function syncEditor(cardId, cv) {
  if (!editing || editing.cardId !== cardId) return;
  const z = (cv.zones || []).find(x =>
    x.k === editing.zone.k && x.index === editing.zone.index && x.sub === editing.zone.sub);
  if (z) { editing.zone = z; place(editing.ta, cv, z); }
}

/* ── 카드 하나에 붙이기 ─────────────────────────────────── */
export function attachDirect(wrap, cv, cardId) {
  const cardOf = () => state.cards.find(c => c.id === cardId);
  const hint = document.createElement('div');
  hint.className = 'zhint';
  hint.hidden = true;
  const tag = document.createElement('span');
  hint.appendChild(tag);
  wrap.appendChild(hint);

  const showHint = z => {
    const s = scaleOf(cv);
    Object.assign(hint.style, {
      left: `${z.x * s}px`, top: `${z.y * s}px`,
      width: `${z.w * s}px`, height: `${z.h * s}px`
    });
    hint.dataset.kind = z.kind;
    tag.textContent = z.kind === 'image' ? '끌어서 이동 · Alt+휠 확대' : '눌러서 고치기';
    hint.hidden = false;
  };

  cv.addEventListener('mousemove', e => {
    if (editing || dragging) return;
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (!z) { hint.hidden = true; cv.style.cursor = 'pointer'; return; }
    showHint(z);
    cv.style.cursor = z.kind === 'image' ? 'grab' : 'text';
  });
  cv.addEventListener('mouseleave', () => { hint.hidden = true; });

  /* 글 — 눌러서 그 자리에서 고치기 */
  cv.addEventListener('click', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind === 'text') { hint.hidden = true; openEditor(wrap, cv, cardOf(), z); return; }
    select(cardId);
  });

  /* 이미지 — 끌어서 옮기기 */
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind !== 'image') return;
    const card = cardOf();
    if (!card?.[z.k]) return;
    e.preventDefault();
    dragging = true;
    cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing';
    hint.hidden = true;
    drag = { z, x: e.clientX, y: e.clientY, from: { ...(card[z.tf] || { s: 1, x: 0, y: 0 }) } };
  });

  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const card = cardOf();
    const s = scaleOf(cv);
    const { slackX, slackY } = slackOf(card, drag.z, drag.from.s);
    const dx = (e.clientX - drag.x) / s;
    const dy = (e.clientY - drag.y) / s;
    patch(card.id, drag.z.tf, {
      s: drag.from.s,
      x: slackX ? clamp1(drag.from.x + dx / slackX) : 0,
      y: slackY ? clamp1(drag.from.y + dy / slackY) : 0
    });
  });

  const endDrag = () => { drag = null; dragging = false; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  /* 이미지 — Alt+휠로 확대.
     그냥 휠은 미리보기를 위아래로 넘기는 데 써야 하므로 건드리지 않습니다. */
  cv.addEventListener('wheel', e => {
    if (!e.altKey) return;
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind !== 'image') return;
    const card = cardOf();
    if (!card?.[z.k]) return;
    e.preventDefault();
    const tf = card[z.tf] || { s: 1, x: 0, y: 0 };
    patch(card.id, z.tf, { ...tf, s: Math.max(1, Math.min(4, tf.s * (1 - e.deltaY * 0.0012))) });
  }, { passive: false });

  cv.addEventListener('dblclick', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind === 'image') patch(cardId, z.tf, { s: 1, x: 0, y: 0 });
  });
}

const clamp1 = v => Math.max(-1, Math.min(1, v));

/** 확대했을 때 좌우·상하로 움직일 수 있는 여유(850px 기준) */
function slackOf(card, z, s) {
  const im = imgOf(card[z.k]);
  if (!isReady(im)) return { slackX: 0, slackY: 0 };
  const base = Math.max(z.w / im.naturalWidth, z.h / im.naturalHeight) * Math.max(1, s);
  return {
    slackX: Math.max(0, (im.naturalWidth * base - z.w) / 2),
    slackY: Math.max(0, (im.naturalHeight * base - z.h) / 2)
  };
}
