/**
 * 캔버스 그리기 공용 헬퍼.
 * 모든 카드 렌더러가 여기 있는 함수만 써서 그리도록 합니다.
 * 출력 폭·여백 같은 규격을 바꾸려면 이 파일 상단 상수만 고치면 됩니다.
 */
import { T } from '../theme.js';

/** 디시인사이드는 가로 850px 를 넘으면 자동 리사이즈합니다. 절대 넘기지 않습니다. */
export const W = 850;
/** 카드 좌우 기본 여백 */
export const PAD = 46;
/** 본문 가용 폭 */
export const CW = W - PAD * 2;

/* ── 측정 전용 컨텍스트 ─────────────────────────────────── */
const mcv = document.createElement('canvas');
export const mctx = mcv.getContext('2d');

/* ── 이미지 캐시 ────────────────────────────────────────── */
const CACHE = new Map();
let onImageLoad = () => {};
/** 이미지 로드가 끝나면 다시 그리도록 콜백을 등록합니다. */
export function setImageLoadHandler(fn) { onImageLoad = fn; }

export function imgOf(dataUrl) {
  if (!dataUrl) return null;
  if (CACHE.has(dataUrl)) return CACHE.get(dataUrl);
  const im = new Image();
  im.onload = () => onImageLoad();
  im.src = dataUrl;
  CACHE.set(dataUrl, im);
  return im;
}
export const isReady = im => !!im && im.complete && im.naturalWidth > 0;

/**
 * 아직 안 불린 이미지가 있으면 다 불릴 때까지 기다립니다.
 * 내보내기 직전에 불러서, 자리 표시자가 찍힌 PNG 가 나가는 일을 막습니다.
 */
export function imagesReady(timeout = 4000) {
  const pending = [...CACHE.values()].filter(im => !isReady(im));
  if (!pending.length) return Promise.resolve();
  return Promise.all(pending.map(im => new Promise(done => {
    im.addEventListener('load', done, { once: true });
    im.addEventListener('error', done, { once: true });
    setTimeout(done, timeout);
  })));
}
/** 이미지의 세로/가로 비율. 아직 안 불렸으면 기본값 */
export const ratioOf = (im, fallback = 0.5625) =>
  isReady(im) ? im.naturalHeight / im.naturalWidth : fallback;

/* ── 텍스트 ─────────────────────────────────────────────── */
export function font(ctx, size, weight = 400, family = T.serif) {
  ctx.font = `${weight} ${size}px ${family}`;
}

/** 한글은 글자 단위, 라틴·숫자는 단어 단위로 끊습니다. */
function tokenize(s) {
  const out = [];
  let buf = '';
  for (const ch of s) {
    if (/[A-Za-z0-9'’\-–—.,%/:()]/.test(ch)) buf += ch;
    else { if (buf) { out.push(buf); buf = ''; } out.push(ch); }
  }
  if (buf) out.push(buf);
  return out;
}

/** 줄 첫머리에 오면 안 되는 글자 (금칙처리). 넘치더라도 앞줄에 붙입니다. */
const NO_LINE_START = /^[.,!?;:%)\]}>”’」』〉》…·、。]/;

export function wrapText(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text ?? '').split('\n')) {
    if (para === '') { lines.push(''); continue; }
    let line = '';
    for (const tk of tokenize(para)) {
      const test = line + tk;
      if (line && ctx.measureText(test).width > maxW) {
        if (NO_LINE_START.test(tk)) { line = test; continue; }  // 문장부호는 매달아 둡니다
        lines.push(line.replace(/\s+$/, ''));
        line = tk === ' ' ? '' : tk;
      } else line = test;
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines;
}

/**
 * 텍스트 블록을 미리 재고 나중에 그립니다.
 * 반환된 h 로 카드 높이를 계산한 뒤 paint(ctx, x, y) 로 그립니다.
 *
 *   const t = text('본문…', { size:20, maxW:CW });
 *   height += t.h;
 *   t.paint(ctx, PAD, y);
 */
export function text(str, opt = {}) {
  const size    = opt.size ?? 20;
  const weight  = opt.weight ?? 400;
  const family  = opt.family ?? T.serif;
  const maxW    = opt.maxW ?? CW;
  const step    = opt.lh ?? Math.round(size * 1.8);
  const color   = opt.color ?? T.ink;
  const align   = opt.align ?? 'left';

  font(mctx, size, weight, family);
  const lines = String(str ?? '') === '' ? [] : wrapText(mctx, str, maxW);

  return {
    lines,
    empty: lines.length === 0,
    h: lines.length * step,
    step,
    paint(ctx, x, y, over = {}) {
      font(ctx, size, weight, family);
      ctx.fillStyle = over.color ?? color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const a = over.align ?? align;
      const boxW = over.maxW ?? maxW;
      lines.forEach((ln, i) => {
        const w = ctx.measureText(ln).width;
        let dx = x;
        if (a === 'center') dx = x + (boxW - w) / 2;
        else if (a === 'right') dx = x + boxW - w;
        ctx.fillText(ln, Math.round(dx), Math.round(y + i * step + step / 2 + size * 0.35));
      });
    }
  };
}

/** 자간을 벌린 한 줄 (라벨·소제목용) */
export function spacedText(ctx, str, x, y, gap, align = 'left', boxW = CW) {
  const chars = [...String(str)];
  if (!chars.length) return 0;
  let total = -gap;
  for (const c of chars) total += ctx.measureText(c).width + gap;
  let dx = x;
  if (align === 'center') dx = x + (boxW - total) / 2;
  else if (align === 'right') dx = x + boxW - total;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const c of chars) {
    ctx.fillText(c, Math.round(dx), Math.round(y));
    dx += ctx.measureText(c).width + gap;
  }
  return total;
}
/** 자간 벌린 텍스트의 폭만 잽니다. */
export function spacedWidth(ctx, str, gap) {
  const chars = [...String(str)];
  if (!chars.length) return 0;
  let total = -gap;
  for (const c of chars) total += ctx.measureText(c).width + gap;
  return total;
}

/* ── 도형 ───────────────────────────────────────────────── */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function rule(ctx, x, y, w, color = T.line, lw = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, Math.round(y) + 0.5);
  ctx.lineTo(x + w, Math.round(y) + 0.5);
  ctx.stroke();
}

/** 가운데 마름모가 있는 중세풍 장식선 */
export function ornament(ctx, cx, y, w) {
  ctx.strokeStyle = T.accent2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - 10, y);
  ctx.moveTo(cx + 10, y);    ctx.lineTo(cx + w / 2, y);
  ctx.stroke();
  ctx.fillStyle = T.accent;
  ctx.beginPath();
  ctx.moveTo(cx, y - 4.5); ctx.lineTo(cx + 4.5, y);
  ctx.lineTo(cx, y + 4.5); ctx.lineTo(cx - 4.5, y);
  ctx.closePath();
  ctx.fill();
}

/* ── 이미지 배치 ────────────────────────────────────────── */
/** 영역을 꽉 채우고 넘치는 부분은 잘라냅니다. */
export function coverImage(ctx, im, x, y, w, h) {
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** 영역 안에 비율 그대로 넣습니다. */
export function containImage(ctx, im, x, y, w, h) {
  const s = Math.min(w / im.naturalWidth, h / im.naturalHeight);
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** 이미지가 아직 없을 때 자리 표시 */
export function placeholder(ctx, x, y, w, h, msg = '이미지를 넣어 주세요') {
  ctx.fillStyle = '#17130e';
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = T.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
  font(ctx, 15, 400, T.serif);
  ctx.fillStyle = T.ink3;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(msg, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
