/**
 * 출력 이미지의 색과 글꼴.
 * 톤을 새로 만들려면 아래에 항목 하나만 추가하면 됩니다. (고르는 UI 는 자동으로 따라옵니다)
 *
 * plain: true 면 장식(마름모 무늬)을 빼고 단순한 선만 씁니다.
 */

const SANS  = '"Pretendard Variable", Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif';
// 톤에서 명조 글꼴은 더 안 씁니다. (편집기 UI 는 css/tokens.css 에서 따로 지정)

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

  /* 흰 바탕. 검정 톤과 정반대라 스크린샷이 또렷하게 도드라집니다.
     디시는 평소 흰 배경이라 카드가 배경에 묻힐 수 있어서,
     테두리를 또렷하게 두고 카드 사이 틈도 짙은 회색으로 둡니다. */
  paper: {
    label: '밝은 (흰색)',
    bg:      '#ffffff',
    panel:   '#f4f4f5',
    panel2:  '#e9e9ec',
    accent:  '#1a1a1c',
    accent2: '#c2c2c8',
    ink:     '#141416',
    ink2:    '#4a4a52',
    ink3:    '#7c7c86',
    line:    '#dcdce1',
    edge:    '#c8c8cf',   // 흰 배경 위에서도 카드 경계가 보이는 선
    gutter:  '#9a9aa2',   // 카드 사이를 가르는 틈
    // 흰 바탕에서는 밝은 색이 안 읽혀서 어둡게 내렸습니다.
    ok:      '#3f7a3a',
    warn:    '#9a7420',
    bad:     '#a8403a',
    serif:   SANS,
    display: SANS,
    sans:    SANS,
    plain:   true
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
