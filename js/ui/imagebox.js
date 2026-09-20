/**
 * 이미지 조절 상자.
 * 카드가 실제로 그리는 것과 같은 비율의 상자를 보여 주고,
 * 끌어서 위치를, 휠이나 슬라이더로 확대를 맞춥니다.
 */
import { imgOf, isReady, placeImage } from '../canvas/layout.js';
import { cardOf } from '../state.js';

const MAX_ZOOM = 4;
const clamp1 = v => Math.max(-1, Math.min(1, v));

/** 끄는 중에는 편집 폼을 다시 그리면 안 되므로 바깥에서 확인할 수 있게 둡니다. */
let adjusting = false;
export const isAdjusting = () => adjusting;

/** 카드가 이미지를 그리는 상자의 가로세로 비율을 알아냅니다. */
function aspectOf(card, def, field) {
  if (typeof def.boxRatio === 'function') return def.boxRatio(card);
  const a = field.aspect;
  if (typeof a === 'function') return a(card);
  if (Number.isFinite(a)) return a;
  const im = imgOf(card[field.k]);
  return isReady(im) ? im.naturalWidth / im.naturalHeight : 16 / 9;
}

/**
 * @param card  편집 중인 카드
 * @param def   카드 정의 (boxRatio 를 갖고 있을 수 있음)
 * @param field 이미지 필드 스키마 ({ k, tf })
 * @param patch (key, value) => void
 */
export function makeImageBox(card0, def, field, patch) {
  const tfKey = field.tf;
  // 카드 객체는 고칠 때마다 새로 만들어지므로, 항상 상태에서 최신 것을 가져옵니다.
  const card = () => cardOf(card0.id) || card0;
  const box = document.createElement('div');
  box.className = 'imgbox';

  const stage = document.createElement('div');
  stage.className = 'imgbox-stage';
  const cv = document.createElement('canvas');
  stage.appendChild(cv);

  // 사진 지우기. 미리보기 쪽 ✕ 와 같은 자리·같은 모양입니다.
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'xbtn imgbox-del';
  del.textContent = '✕';
  del.title = '이 사진 지우기';
  del.setAttribute('aria-label', '이 사진 지우기');
  del.addEventListener('click', e => {
    e.stopPropagation();
    adjusting = false;            // 지우고 나면 폼을 다시 그려야 합니다
    patch(tfKey, { s: 1, x: 0, y: 0 });
    patch(field.k, null);
  });
  stage.appendChild(del);

  const bar = document.createElement('div');
  bar.className = 'imgbox-bar';
  const zoom = document.createElement('input');
  zoom.type = 'range';
  zoom.min = '1'; zoom.max = String(MAX_ZOOM); zoom.step = '0.02';
  const val = document.createElement('span');
  val.className = 'imgbox-val';
  const reset = document.createElement('button');
  reset.className = 'mini';
  reset.textContent = '초기화';
  reset.title = '확대와 위치를 처음으로';
  bar.append(zoom, val, reset);

  const tip = document.createElement('p');
  tip.className = 'hint';
  tip.textContent = '끌어서 위치 · 휠로 확대 · 더블클릭으로 초기화';

  box.append(stage, bar, tip);

  const tf = () => card()[tfKey] || { s: 1, x: 0, y: 0 };
  const setTf = next => { patch(tfKey, next); redraw(); };

  function geom() {
    const im = imgOf(card()[field.k]);
    // 마우스 이동량과 같은 좌표계로 재야 합니다. (화면 배율이 걸려 있어도 어긋나지 않게)
    const r = cv.getBoundingClientRect();
    const w = r.width || cv.clientWidth || 260;
    const h = r.height || cv.clientHeight || 150;
    if (!isReady(im)) return { w, h, slackX: 0, slackY: 0 };
    const base = Math.max(w / im.naturalWidth, h / im.naturalHeight) * Math.max(1, tf().s);
    const dw = im.naturalWidth * base, dh = im.naturalHeight * base;
    return { w, h, slackX: Math.max(0, (dw - w) / 2), slackY: Math.max(0, (dh - h) / 2) };
  }

  function redraw() {
    const im = imgOf(card()[field.k]);
    const aspect = Math.max(0.2, aspectOf(card(), def, field));
    const w = stage.clientWidth || 260;
    const h = Math.round(Math.min(240, Math.max(90, w / aspect)));
    stage.style.height = `${h}px`;

    const dpr = 2;
    cv.style.width = '100%';
    cv.style.height = `${h}px`;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);

    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d0b08';
    ctx.fillRect(0, 0, w, h);
    if (isReady(im)) placeImage(ctx, im, 0, 0, w, h, tf());

    zoom.value = String(Math.max(1, tf().s));
    val.textContent = `${Math.round(Math.max(1, tf().s) * 100)}%`;
    box.classList.toggle('empty', !isReady(im));
    del.hidden = !isReady(im);
  }

  /* ── 끌어서 위치 ─────────────────────────────────────── */
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    if (!isReady(imgOf(card()[field.k]))) return;
    adjusting = true;
    cv.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, from: { ...tf() } };
    cv.classList.add('grabbing');
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const g = geom();
    setTf({
      s: drag.from.s,
      x: g.slackX ? clamp1(drag.from.x + (e.clientX - drag.x) / g.slackX) : 0,
      y: g.slackY ? clamp1(drag.from.y + (e.clientY - drag.y) / g.slackY) : 0
    });
  });
  const endDrag = () => { drag = null; adjusting = false; cv.classList.remove('grabbing'); };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  /* ── 휠로 확대 ───────────────────────────────────────── */
  cv.addEventListener('wheel', e => {
    if (!isReady(imgOf(card()[field.k]))) return;
    e.preventDefault();
    const next = Math.max(1, Math.min(MAX_ZOOM, tf().s * (1 - e.deltaY * 0.0012)));
    setTf({ ...tf(), s: next });
  }, { passive: false });

  cv.addEventListener('dblclick', () => setTf({ s: 1, x: 0, y: 0 }));

  zoom.addEventListener('pointerdown', () => { adjusting = true; });
  zoom.addEventListener('pointerup', () => { adjusting = false; });
  zoom.addEventListener('input', () => setTf({ ...tf(), s: +zoom.value }));
  reset.addEventListener('click', () => setTf({ s: 1, x: 0, y: 0 }));

  // 패널 폭이 정해진 뒤에 그려야 크기가 맞습니다.
  requestAnimationFrame(redraw);
  return box;
}
