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
import { readImageFile } from '../io/files.js';
import { renderInto } from '../canvas/render.js';

/** 편집 중일 때는 미리보기를 다시 만들지 않고 그림만 갱신합니다. */
let editing = null;   // { cardId, zone, ta, wrap }
let dragging = false;

/* ── 끄는 동안의 임시 값 ────────────────────────────────────
   사진을 끌 때마다 상태를 고치면 카드 목록·자동저장·미리보기 재예약이
   한꺼번에 돌아서 그림이 뚝뚝 끊깁니다. 그래서 끄는 동안에는 상태를 건드리지 않고
   이 값으로만 다시 그리고, 손을 뗄 때 한 번에 반영합니다.
   덤으로 되돌리기도 "끈 만큼"이 아니라 "한 번 끈 것"으로 한 덩어리가 됩니다. */
let ghost = null;   // { cv, cardId, key, tf, raf, timer }

export const isBusy = () => !!editing || dragging || !!ghost;

function paintGhost() {
  if (!ghost) return;
  ghost.raf = 0;
  const card = state.cards.find(c => c.id === ghost.cardId);
  if (!card) return;
  const cv = ghost.cv;
  renderInto(cv, { ...card, [ghost.key]: ghost.tf }, cv.width / W);
  cv.style.width = `${W}px`;
  cv.syncDels?.();
}

/** 화면 한 장에 한 번만 그립니다. (마우스는 그보다 자주 움직입니다) */
function setGhost(cv, cardId, key, tf, commitAfter = 0) {
  if (ghost && (ghost.cardId !== cardId || ghost.key !== key)) commitGhost();
  if (ghost) { ghost.cv = cv; ghost.tf = tf; clearTimeout(ghost.timer); }
  else ghost = { cv, cardId, key, tf, raf: 0, timer: 0 };
  if (!ghost.raf) ghost.raf = requestAnimationFrame(paintGhost);
  if (commitAfter) ghost.timer = setTimeout(commitGhost, commitAfter);
}

function commitGhost() {
  if (!ghost) return;
  const g = ghost;
  ghost = null;
  if (g.raf) cancelAnimationFrame(g.raf);
  clearTimeout(g.timer);
  patch(g.cardId, g.key, g.tf);
}

/** 끄는 중이면 상태 대신 임시 값을 봐야 합니다. */
function tfOf(card, key) {
  if (ghost && ghost.cardId === card.id && ghost.key === key) return ghost.tf;
  return card[key] || { s: 1, x: 0, y: 0 };
}

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
/** 접어 둔 묶음 안쪽까지 훑어서 예시 문구를 찾습니다. */
function flatFields(fields = []) {
  return fields.flatMap(f => (f.t === 'fold' ? flatFields(f.fields) : [f]));
}
const hintOf = (card, z) =>
  flatFields(BY_ID[card.type]?.fields).find(f => f.k === z.k)?.ph || '내용을 입력하세요';

/* ── 좌표 변환 ──────────────────────────────────────────────
   화면 크기(html 의 zoom) 때문에 좌표계가 둘입니다.
   · getBoundingClientRect / 마우스 좌표 : 배율이 곱해진 값
   · clientWidth / CSS 로 얹는 요소       : 배율이 안 곱해진 값
   둘을 섞으면 커서와 잡히는 자리가 배율만큼 어긋납니다. 그래서 따로 둡니다. */

/** 마우스 좌표를 850 기준으로 바꿀 때 */
const hitScale = cv => (cv.getBoundingClientRect().width || W) / W;
/** 850 기준 자리를 캔버스 위에 얹을 때 */
const cssScale = cv => (cv.clientWidth || W) / W;

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
  const s = hitScale(cv);
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
  const s = cssScale(cv);
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

/** 다시 그린 뒤 사진 지우기 단추를 새 자리로 옮깁니다. */
export function syncZoneDels(cv) {
  cv.syncDels?.();
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

  // 점수 막대에는 네모 테두리 대신 손잡이를 띄웁니다. 어디를 잡는지 바로 보이게요.
  const knob = document.createElement('div');
  knob.className = 'zknob';
  knob.hidden = true;
  wrap.appendChild(knob);

  const hideAll = () => { hint.hidden = true; knob.hidden = true; };

  /* 사진 지우기 단추. 사진이 든 자리마다 그 오른쪽 위에 하나씩 얹습니다.
     캔버스 위에 덧대는 요소라 결과물에는 나가지 않습니다. */
  const dels = [];
  const syncDels = () => {
    const card = cardOf();
    const zs = (cv.zones || []).filter(z => z.kind === 'image' && card?.[z.k]);

    while (dels.length < zs.length) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xbtn zdel';
      b.textContent = '✕';
      b.title = '이 사진 지우기';
      b.setAttribute('aria-label', '이 사진 지우기');
      b.addEventListener('click', e => {
        e.stopPropagation();
        const z = b.zone;
        if (!z) return;
        commitGhost();   // 맞추던 중이었다면 먼저 정리하고 지웁니다
        if (z.tf) patch(cardId, z.tf, { s: 1, x: 0, y: 0 });
        patch(cardId, z.k, null);
      });
      wrap.appendChild(b);
      dels.push(b);
    }

    const s = cssScale(cv);
    const cw = cv.clientWidth || W;
    dels.forEach((b, i) => {
      const z = zs[i];
      if (!z) { b.hidden = true; b.zone = null; return; }
      const right = (z.x + z.w) * s;
      let top = z.y * s + 9;
      // 사진이 카드 오른쪽 끝까지 닿으면 카드 지우기 단추와 겹치므로 한 칸 내립니다.
      if (right > cw - 48 && top < 42) top = 42;
      b.style.left = `${right - 9 - 24}px`;
      b.style.top = `${top}px`;
      b.zone = z;
      b.hidden = false;
    });
  };
  cv.syncDels = syncDels;
  syncDels();

  const showKnob = z => {
    const card = cardOf();
    if (!card) return;
    const s = cssScale(cv);
    const raw = +getValue(card, z) || 0;
    const v = Math.max(z.min, Math.min(z.max, raw));
    const ratio = (v - z.min) / (z.max - z.min || 1);
    knob.style.left = `${(z.x + z.w * ratio) * s}px`;
    knob.style.top  = `${(z.y + z.h / 2) * s}px`;
    knob.dataset.v = Number.isInteger(v) ? v : Math.round(v * 10) / 10;
    knob.hidden = false;
  };

  const showHint = z => {
    if (z.kind === 'slider') { hint.hidden = true; showKnob(z); return; }
    knob.hidden = true;
    const s = cssScale(cv);
    Object.assign(hint.style, {
      left: `${z.x * s}px`, top: `${z.y * s}px`,
      width: `${z.w * s}px`, height: `${z.h * s}px`
    });
    hint.dataset.kind = z.kind;
    const empty = z.kind === 'image' && !cardOf()?.[z.k];
    tag.textContent = z.kind !== 'image' ? '눌러서 고치기'
                    : empty              ? '눌러서 사진 넣기'
                    : '끌어서 이동 · Alt+휠 확대';
    hint.hidden = false;
  };

  cv.addEventListener('mousemove', e => {
    if (editing || dragging) return;
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (!z) { hideAll(); cv.style.cursor = 'pointer'; return; }
    showHint(z);
    cv.style.cursor = z.kind === 'slider' ? 'ew-resize'
                    : z.kind !== 'image'  ? 'text'
                    : cardOf()?.[z.k]     ? 'grab' : 'pointer';
  });
  cv.addEventListener('mouseleave', () => { if (!slide) hideAll(); });

  /* 글 — 눌러서 그 자리에서 고치기 */
  cv.addEventListener('click', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind === 'slider') return;   // 끌기에서 이미 처리했습니다
    if (z?.kind === 'text') { hint.hidden = true; openEditor(wrap, cv, cardOf(), z); return; }
    // 아직 사진이 없는 자리는 눌러서 바로 고릅니다.
    if (z?.kind === 'image' && !cardOf()?.[z.k]) { hint.hidden = true; pickImage(cardId, z); return; }
    select(cardId);
  });

  /* 막대 — 좌우로 끌어서 숫자 바꾸기 */
  let slide = null;
  const applySlide = zx => {
    const z = slide;
    const ratio = Math.max(0, Math.min(1, (zx - z.x) / z.w));
    let v = z.min + ratio * (z.max - z.min);
    v = Math.round(v / z.step) * z.step;
    v = Math.round(Math.max(z.min, Math.min(z.max, v)) * 10) / 10;

    const card = cardOf();
    if (!card) return;
    setValue(card, z, String(v));

    // 손을 떼기 전까지 손잡이와 막대가 바로 따라오게 합니다.
    const fresh = cardOf();
    if (fresh) {
      renderInto(cv, fresh, cv.width / W);
      cv.style.width = `${W}px`;
      const z2 = (cv.zones || []).find(x =>
        x.kind === 'slider' && x.k === z.k && x.index === z.index && x.sub === z.sub);
      if (z2) { slide = z2; showKnob(z2); }
    }
  };

  /* 이미지 — 끌어서 옮기기 */
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);

    if (z?.kind === 'slider') {
      e.preventDefault();
      dragging = true;
      cv.setPointerCapture(e.pointerId);
      hint.hidden = true;
      knob.classList.add('on');
      slide = z;
      applySlide(zx);
      return;
    }

    if (z?.kind !== 'image') return;
    const card = cardOf();
    if (!card?.[z.k]) return;
    e.preventDefault();
    dragging = true;
    cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing';
    hint.hidden = true;
    drag = { z, x: e.clientX, y: e.clientY, from: { ...tfOf(card, z.tf) } };
  });

  cv.addEventListener('pointermove', e => {
    if (slide) { applySlide(localPoint(cv, e).zx); return; }
    if (!drag) return;
    const card = cardOf();
    if (!card) return;
    const s = hitScale(cv);
    const { slackX, slackY } = slackOf(card, drag.z, drag.from.s);
    const dx = (e.clientX - drag.x) / s;
    const dy = (e.clientY - drag.y) / s;
    setGhost(cv, cardId, drag.z.tf, {
      s: drag.from.s,
      x: slackX ? clamp1(drag.from.x + dx / slackX) : 0,
      y: slackY ? clamp1(drag.from.y + dy / slackY) : 0
    });
  });

  const endDrag = () => {
    if (drag) commitGhost();
    drag = null; slide = null; dragging = false;
    knob.classList.remove('on');
    cv.style.cursor = 'default';
  };
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
    // 휠도 연달아 들어오므로 끄는 것과 같은 방식으로 그리고, 멈추면 반영합니다.
    const tf = tfOf(card, z.tf);
    setGhost(cv, cardId, z.tf,
             { ...tf, s: Math.max(1, Math.min(4, tf.s * (1 - e.deltaY * 0.0012))) }, 200);
  }, { passive: false });

  cv.addEventListener('dblclick', e => {
    const { zx, zy } = localPoint(cv, e);
    const z = hit(cv.zones || [], zx, zy);
    if (z?.kind !== 'image') return;
    setGhost(cv, cardId, z.tf, { s: 1, x: 0, y: 0 });
    commitGhost();
  });
}

const clamp1 = v => Math.max(-1, Math.min(1, v));

/** 빈 사진 자리를 눌렀을 때 파일 고르기 창을 엽니다. */
function pickImage(cardId, z) {
  const picker = document.getElementById('filePick');
  if (!picker) return;
  picker.value = '';
  picker.multiple = false;
  picker.onchange = async () => {
    const f = picker.files?.[0];
    if (!f) return;
    try {
      if (z.tf) patch(cardId, z.tf, { s: 1, x: 0, y: 0 });
      patch(cardId, z.k, await readImageFile(f));
    } catch { /* 못 읽으면 그냥 둡니다 */ }
  };
  picker.click();
}

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
