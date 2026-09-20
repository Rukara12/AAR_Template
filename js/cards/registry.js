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
 *     group   : '본문',                        팔레트 묶음 — 시작 / 본문 / 평가 / 곁들이기 / 캐릭터
 *     accent  : '#8fb254',                    목록에서 쓰는 표시색
 *     create(): {...}                         새로 만들 때의 기본값
 *     fields  : [...]                         편집 폼 스키마 (ui/inspector.js 참고)
 *     label(c): '목록에 보일 한 줄 요약'
 *     build(c): { h, paint(ctx) }             높이를 먼저 재고 나중에 그립니다
 *   }
 *
 * ▶ 편집 폼에서 쓸 수 있는 field 타입
 *   text | textarea | number | range | select | toggle | image | strlist | pairs
 *   fold (접어 두기) | steam · fetch (상점 주소 칸)
 *
 * ▶ 설명은 되도록 적지 마세요
 *   폼은 «고치는 곳»이지 «읽는 곳»이 아닙니다. 예시는 ph 로 보여 주면 충분합니다.
 *   그래도 꼭 알려야 할 것이 있으면 field 에 note: '한 줄' 을 적으세요. 칸 아래에 작게 붙습니다.
 */

import cover    from './cover.js';
import status   from './status.js';
import shot     from './shot.js';
import text     from './text.js';
import section  from './section.js';
import grid     from './grid.js';
import compare  from './compare.js';
import score    from './score.js';
import proscons from './proscons.js';
import verdict  from './verdict.js';
import quote    from './quote.js';
import divider  from './divider.js';
import dialogue from './dialogue.js';
import profile  from './profile.js';

/**
 * 팔레트에 뜨는 순서 = 리뷰에서 놓이는 순서.
 * 위에서 아래로 훑으면 한 편이 그대로 완성되도록 묶고 정렬했습니다.
 * 각 묶음 안에서는 자주 쓰는 것부터 둡니다.
 */
export const LIST = [
  // 시작 — 리뷰 맨 앞
  cover, status,
  // 본문 — 실제로 가장 많이 찍어 내는 것들
  shot, text, section, grid, compare,
  // 평가 — 리뷰의 결론부
  score, proscons, verdict,
  // 곁들이기 — 필요할 때만
  quote, divider,
  // 캐릭터
  dialogue, profile
];

/** 처음에 접어 두는 묶음. 자주 안 쓰는 것들을 숨겨 팔레트를 짧게 유지합니다. */
export const DEFAULT_COLLAPSED = ['캐릭터'];

export const BY_ID = Object.fromEntries(LIST.map(c => [c.id, c]));

/** 팔레트에 표시할 순서대로 묶습니다. */
export const GROUPS = (() => {
  const g = [];
  for (const c of LIST) {
    let row = g.find(x => x.name === c.group);
    if (!row) {
      row = { name: c.group, items: [], collapsed: DEFAULT_COLLAPSED.includes(c.group) };
      g.push(row);
    }
    row.items.push(c);
  }
  return g;
})();

/**
 * 문서 구성 목록에서 쓰는 색. 카드마다 다른 색을 쓰면 열네 가지가 되어 어지럽습니다.
 * 묶음마다 한 색으로 묶어서, 목록만 봐도 «시작 / 본문 / 평가» 가 덩어리로 보이게 합니다.
 */
export const groupColorOf = typeId => {
  const g = GROUPS.find(x => x.items.some(c => c.id === typeId));
  return g?.items[0]?.accent || 'var(--line)';
};

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
