/** 파일 읽기·내려받기 관련. */
import { W } from '../canvas/layout.js';

/** 원본이 너무 크면 프로젝트 파일이 무거워지므로 출력 폭에 맞춰 줄입니다. */
const MAX_W = W;
const MAX_H = 2400;

/**
 * 디시는 파일명이 한글·영문·숫자가 아니면 업로드가 깨질 수 있습니다.
 * 그 외 문자는 밑줄로 바꿉니다.
 */
export function safeName(s, fallback = '연재') {
  const out = String(s ?? '')
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return out || fallback;
}

/** File → 축소된 dataURL */
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('이미지 파일이 아닙니다.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error('이미지를 열지 못했습니다.'));
      im.onload = () => resolve(shrink(im));
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function shrink(im) {
  const s = Math.min(1, MAX_W / im.naturalWidth, MAX_H / im.naturalHeight);
  const w = Math.round(im.naturalWidth * s);
  const h = Math.round(im.naturalHeight * s);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, 0, 0, w, h);
  return hasAlpha(ctx, w, h) ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.92);
}

/** 투명 픽셀이 있으면 PNG 로 남깁니다. (그 외에는 JPEG 로 용량을 줄입니다) */
function hasAlpha(ctx, w, h) {
  try {
    const d = ctx.getImageData(0, 0, w, h).data;
    const step = Math.max(4, Math.floor(d.length / 4 / 20000) * 4);
    for (let i = 3; i < d.length; i += step) if (d[i] < 250) return true;
  } catch { return true; }
  return false;
}

/** 클립보드·드롭 이벤트에서 첫 이미지 파일을 꺼냅니다. */
export function firstImageFrom(dt) {
  if (!dt) return null;
  if (dt.files?.length) {
    for (const f of dt.files) if (f.type.startsWith('image/')) return f;
  }
  if (dt.items?.length) {
    for (const it of dt.items) if (it.kind === 'file' && it.type.startsWith('image/')) return it.getAsFile();
  }
  return null;
}

export function downloadCanvas(canvas, filename) {
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 400);
    }, 'image/png');
  });
}

export function downloadText(str, filename, mime = 'application/json') {
  const blob = new Blob([str], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
