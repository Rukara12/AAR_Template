/**
 * 상점 주소 한 번으로 여러 카드를 한꺼번에 채웁니다.
 *
 * 표지 카드와 게임 정보 카드가 같은 게임을 가리키는데 주소를 두 번 넣게 하면 번거롭습니다.
 * 그래서 어느 쪽에서 눌러도 둘 다 처리하고, 넣은 주소는 문서에 기억해 둡니다.
 *
 *   표지        사진이 비어 있으면 헤더 이미지를, 제목이 비어 있으면 게임 이름을
 *   게임 정보   개발자 · 출시일 · 장르 · 가격 · 평가
 *
 * 사진은 이미 넣어 둔 것을 덮지 않습니다. 직접 올린 사진이 날아가면 되돌리기 힘듭니다.
 * (누른 그 카드만 예외로 덮어씁니다)
 */
import { state, patchMany, setMeta } from '../state.js';
import { BY_ID } from '../cards/registry.js';
import { fetchGameInfo, fillStats } from './steamapi.js';
import { fetchSteamImage } from './steam.js';

const flat = (fs = []) => fs.flatMap(f => (f.t === 'fold' ? flat(f.fields || []) : [f]));
const fieldOf = (card, t) => flat(BY_ID[card.type]?.fields).find(f => f.t === t);

/** 넣은 주소는 문서에 남겨서 다른 카드에서도 그대로 보이게 합니다. */
export function rememberSteam(text) {
  setMeta('steam', String(text || '').trim());
}
export const rememberedSteam = () => state.meta.steam || '';

/**
 * @param appid   앱 번호
 * @param useProxy  가격·한국어 평가까지 받을지
 * @param from    지금 누른 카드 id. 그 카드는 이미 있는 값도 덮어씁니다.
 * @returns { filled: string[], partial: boolean, found: boolean }
 */
export async function applySteam(appid, { useProxy = true, from = null } = {}) {
  const covers = state.cards.filter(c => fieldOf(c, 'steam'));
  const infos  = state.cards.filter(c => fieldOf(c, 'fetch'));

  // 제목이 빈 표지가 있으면 게임 이름이 필요합니다.
  const needName = covers.some(c => !c.title);
  const needInfo = infos.length > 0 || needName;

  // 게임 정보 카드가 없으면 프록시까지 갈 이유가 없습니다. 이름만 있으면 됩니다.
  const info = needInfo
    ? await fetchGameInfo(appid, { useProxy: useProxy && infos.length > 0 })
    : null;

  if (needInfo && !info) return { filled: [], partial: false, found: false };

  const filled = [];

  for (const card of infos) {
    const { stats, filled: got } = fillStats(card.stats, info.values, { overwrite: true });
    if (!got.length) continue;
    patchMany(card.id, { stats });
    filled.push(...got);
  }

  for (const card of covers) {
    const f = fieldOf(card, 'steam');
    const mine = from === card.id;
    const next = {};

    if (mine || !card[f.target]) {
      const got = await fetchSteamImage(appid, f.sources(card));
      if (got) {
        next[f.target] = got.url;
        if (f.tf) next[f.tf] = { s: 1, x: 0, y: 0 };
        filled.push(`표지 사진 ${got.w}×${got.h}`);
      }
    }
    if (!card.title && info?.values?.이름) {
      next.title = info.values.이름;
      filled.push('표지 제목');
    }
    if (Object.keys(next).length) patchMany(card.id, next);
  }

  return { filled, partial: !!info?.partial, found: true };
}
