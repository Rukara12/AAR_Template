/** 파일 읽기·내려받기 관련. */

/**
 * 넣은 이미지를 보관할 최대 크기.
 * 출력 배율을 3배(2550px)까지 올릴 수 있으므로 그보다 넉넉하게 잡습니다.
 * 여기서 줄여 버리면 아무리 배율을 올려도 화질이 돌아오지 않습니다.
 */
const MAX_W = 2800;
const MAX_H = 2800;
/** 확대해서 잘라 쓰는 경우가 많아 압축을 세게 걸지 않습니다. */
const JPEG_Q = 0.95;

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
  if (hasAlpha(ctx, w, h)) return cv.toDataURL('image/png');
  // webp 가 되면 같은 화질에 용량이 훨씬 작습니다.
  const webp = cv.toDataURL('image/webp', JPEG_Q);
  return webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/jpeg', JPEG_Q);
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

/** 저장 형식. webp 는 디시의 강제 리사이즈를 통과합니다. */
export const FORMATS = {
  webp: { mime: 'image/webp', ext: 'webp', q: 0.94 },
  png:  { mime: 'image/png',  ext: 'png',  q: undefined }
};

/** @returns 저장한 파일 크기(byte) */
export function downloadCanvas(canvas, baseName, formatKey = 'webp') {
  const f = FORMATS[formatKey] || FORMATS.png;
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      // webp 를 지원하지 않는 브라우저면 png 로 떨어집니다.
      const ext = blob.type === f.mime ? f.ext : 'png';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${baseName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { URL.revokeObjectURL(url); resolve(blob.size); }, 400);
    }, f.mime, f.q);
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
