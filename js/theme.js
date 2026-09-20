/**
 * 출력 이미지의 색과 글꼴.
 * 톤을 새로 만들려면 아래에 항목 하나만 추가하면 됩니다. (고르는 UI 는 자동으로 따라옵니다)
 *
 * plain: true 면 장식(마름모 무늬)을 빼고 단순한 선만 씁니다.
 */

const SANS  = '"Pretendard Variable", Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif';
const MYUNG = '"Nanum Myeongjo", Batang, "바탕", serif';

export const THEMES = {
  /* 무채색. 어떤 게임 스크린샷 옆에 놓아도 튀지 않습니다.
     강조색을 따로 두지 않고 흰색으로 대신합니다. */
  basic: {
    label: '기본 (검정)',
    bg:      '#0f0f10',
    panel:   '#171719',
    panel2:  '#212124',
    accent:  '#f0f0f1',
    accent2: '#48484d',
    ink:     '#f2f2f3',
    ink2:    '#b4b4b8',
    ink3:    '#86868b',
    line:    '#2a2a2d',
    edge:    '#34343a',   // 카드 테두리 — 밝히면 흰 선처럼 튑니다
    gutter:  '#000000',   // 카드 사이를 가르는 틈
    // 점수·장단점에서 의미는 살리되, 검정 위에서 튀지 않게 채도를 낮췄습니다.
    ok:      '#8fae86',
    warn:    '#b9a173',
    bad:     '#b8817c',
    serif:   SANS,
    display: SANS,
    sans:    SANS,
    plain:   true
  },

  warm: {
    label: '따뜻한',
    bg:      '#1c1815',
    panel:   '#241f1a',
    panel2:  '#2e2822',
    accent:  '#e8a04a',
    accent2: '#8a5f2a',
    ink:     '#f0eae2',
    ink2:    '#c2b7a8',
    ink3:    '#948877',
    line:    '#3a332b',
    edge:    '#453b30',   // 카드 테두리
    gutter:  '#0b0908',   // 카드 사이를 가르는 틈
    ok:      '#93c46a',
    warn:    '#e8b45a',
    bad:     '#e0796c',
    serif:   SANS,
    display: SANS,
    sans:    SANS,
    plain:   true
  },

  parchment: {
    label: '중세·양피지',
    bg:      '#1a1712',
    panel:   '#221e17',
    panel2:  '#2b2519',
    accent:  '#c8973f',
    accent2: '#8a6a2c',
    ink:     '#ece7db',
    ink2:    '#b3a894',
    ink3:    '#867c69',
    line:    '#3d3529',
    edge:    '#4a4033',   // 카드 테두리
    gutter:  '#0a0806',   // 카드 사이를 가르는 틈
    ok:      '#8fb254',
    warn:    '#d99a3a',
    bad:     '#c26a63',
    serif:   MYUNG,
    display: `"Cinzel", ${MYUNG}`,
    sans:    SANS,
    plain:   false
  }
};

export const DEFAULT_THEME = 'basic';

/**
 * 현재 톤. 카드들이 이 객체를 그대로 참조하므로 통째로 바꾸지 않고 속성만 갈아끼웁니다.
 * (그래야 이미 import 해 간 곳에서도 새 값이 보입니다)
 */
export const T = { ...THEMES[DEFAULT_THEME] };

export function setTheme(key) {
  const next = THEMES[key] || THEMES[DEFAULT_THEME];
  for (const k of Object.keys(T)) delete T[k];
  Object.assign(T, next);
  return T;
}
