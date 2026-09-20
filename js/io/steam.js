/**
 * 스팀 상점 이미지를 바로 받아 옵니다.
 *
 * 스팀 상점 API(JSON)는 CORS 를 막아 두어서 브라우저에서 못 부르지만,
 * 이미지 CDN 은 CORS 를 열어 둡니다. crossOrigin 으로 받으면 캔버스도 오염되지 않아
 * 그대로 그려서 내보낼 수 있습니다. (실제로 확인했습니다)
 *
 * 같은 규격이라도 파일이 여러 개라 큰 것부터 시도하고, 없으면 다음 것으로 내려갑니다.
 */
import { shrinkImage } from './files.js';

const CDN = 'https://shared.steamstatic.com/store_item_assets/steam/apps/';

/** 상점 주소나 앱 번호에서 번호만 뽑습니다. */
export function appIdFrom(text) {
  const s = String(text || '').trim();
  const m = s.match(/\/app\/(\d+)/);
  if (m) return m[1];
  return /^\d{3,}$/.test(s) ? s : null;
}

function tryLoad(url) {
  return new Promise(resolve => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im.naturalWidth ? im : null);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

/**
 * @param files 후보 파일 이름. 앞에 있는 것부터 시도합니다.
 * @returns { url, file, w, h } 또는 못 찾으면 null
 */
export async function fetchSteamImage(appid, files) {
  for (const f of files) {
    const im = await tryLoad(`${CDN}${appid}/${f}`);
    if (im) return { url: shrinkImage(im), file: f, w: im.naturalWidth, h: im.naturalHeight };
  }
  return null;
}
