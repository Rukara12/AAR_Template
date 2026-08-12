/**
 * 카드 타입 등록소.
 *
 * ▶ 새 카드를 추가하려면
 *   1) js/cards/내카드.js 를 만들고
 *   2) 아래 import 와 LIST 에 한 줄씩 추가하면 끝입니다.
 *   팔레트·편집 폼·미리보기·내보내기는 전부 자동으로 따라옵니다.
 *
 * ▶ 카드 모듈이 지켜야 할 형태
 *   {
 *     id      : 'shot',                       고유 키 (저장 파일에 기록됨. 바꾸지 마세요)
 *     name    : '자막 스샷',                   팔레트에 뜨는 이름
 *     desc    : '스샷 + 자막',                 팔레트 설명 한 줄
 *     group   : '이미지',                      팔레트 묶음
 *     accent  : '#8fb254',                    목록에서 쓰는 표시색
 *     create(): {...}                         새로 만들 때의 기본값
 *     fields  : [...]                         편집 폼 스키마 (ui/inspector.js 참고)
 *     label(c): '목록에 보일 한 줄 요약'
 *     build(c): { h, paint(ctx) }             높이를 먼저 재고 나중에 그립니다
 *   }
 *
 * ▶ 편집 폼에서 쓸 수 있는 field 타입
 *   text | textarea | number | range | select | toggle | image | strlist | pairs | note
 */

import cover    from './cover.js';
import text     from './text.js';
import shot     from './shot.js';
import image    from './image.js';
import compare  from './compare.js';
import dialogue from './dialogue.js';
import profile  from './profile.js';
import status   from './status.js';
import quote    from './quote.js';
import divider  from './divider.js';
import choice   from './choice.js';
import result   from './result.js';
import outro    from './outro.js';

export const LIST = [
  cover, text, shot, image, compare,
  dialogue, profile, status,
  quote, divider,
  choice, result, outro
];

export const BY_ID = Object.fromEntries(LIST.map(c => [c.id, c]));

/** 팔레트에 표시할 순서대로 묶습니다. */
export const GROUPS = (() => {
  const g = [];
  for (const c of LIST) {
    let row = g.find(x => x.name === c.group);
    if (!row) { row = { name: c.group, items: [] }; g.push(row); }
    row.items.push(c);
  }
  return g;
})();

const uid = () => Math.random().toString(36).slice(2, 9);

/** 타입 id 로 새 카드 인스턴스를 만듭니다. */
export function createCard(typeId) {
  const def = BY_ID[typeId];
  if (!def) throw new Error(`알 수 없는 카드 타입: ${typeId}`);
  return { id: uid(), type: typeId, ...structuredClone(def.create()) };
}

/** 저장 파일을 읽을 때 빠진 속성을 기본값으로 채웁니다. (구버전 호환) */
export function normalize(card) {
  const def = BY_ID[card.type];
  if (!def) return null;
  return { id: card.id || uid(), type: card.type, ...structuredClone(def.create()), ...card };
}
