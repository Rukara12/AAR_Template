/**
 * 화면 크기(UI 배율)와 그에 따른 레이아웃 단계.
 * 브라우저의 Ctrl +/- 와 같은 방식으로 편집기 전체를 키웁니다.
 * 출력 이미지는 850px 로 고정이라 이 값에 영향받지 않습니다.
 */

const KEY = 'aar-template/ui-scale';
const STEPS = [1, 1.15, 1.25, 1.4, 1.5, 1.75, 2];

/** 화면이 클수록 창도 크게 쓰므로 처음부터 조금 키워 둡니다. */
function auto() {
  const w = globalThis.screen?.width || 1280;
  if (w >= 3000) return 1.5;
  if (w >= 2400) return 1.4;
  if (w >= 1800) return 1.25;
  return 1;
}

let scale = 1;
let readout = null;
let onChange = () => {};

export const currentScale = () => scale;

/**
 * 배율이 걸린 뒤 실제로 쓸 수 있는 폭(CSS px).
 * innerWidth 는 zoom 의 영향을 받지 않으므로 직접 나눠 줍니다.
 * 미디어 쿼리가 zoom 을 반영한다는 보장이 없어 레이아웃 단계는 여기서 정합니다.
 */
function effectiveWidth() {
  return (globalThis.innerWidth || 1280) / scale;
}

function updateLayoutStep() {
  const w = effectiveWidth();
  const step = w >= 1500 ? 'wide'
             : w >= 1280 ? 'mid'
             : w >= 980  ? 'narrow'
             : 'tight';
  if (document.body.dataset.w !== step) document.body.dataset.w = step;
}

export function initUiScale(readoutEl, changed) {
  readout = readoutEl;
  onChange = changed || (() => {});
  let saved = NaN;
  try { saved = parseFloat(localStorage.getItem(KEY)); } catch { /* noop */ }
  applyScale(Number.isFinite(saved) ? saved : auto(), false);
  globalThis.addEventListener('resize', updateLayoutStep);
}

export function applyScale(v, persist = true) {
  scale = Math.min(2, Math.max(1, +v || 1));
  document.documentElement.style.setProperty('--ui-scale', String(scale));
  if (readout) readout.textContent = `${Math.round(scale * 100)}%`;
  if (persist) { try { localStorage.setItem(KEY, String(scale)); } catch { /* noop */ } }
  updateLayoutStep();
  onChange(scale);
}

/** dir 이 +1 이면 한 단계 크게, -1 이면 한 단계 작게 */
export function stepScale(dir) {
  let i = 0, best = Infinity;
  STEPS.forEach((s, k) => {
    const d = Math.abs(s - scale);
    if (d < best) { best = d; i = k; }
  });
  applyScale(STEPS[Math.min(STEPS.length - 1, Math.max(0, i + dir))]);
}

/** 화면 크기에 맞는 기본값으로 되돌립니다. */
export function resetScale() { applyScale(auto()); }
