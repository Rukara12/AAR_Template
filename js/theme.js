/**
 * 출력 이미지의 색/폰트. 연재물 톤을 바꾸고 싶으면 이 파일만 고치면 됩니다.
 * (편집기 UI 색상은 css/tokens.css 에 따로 있습니다.)
 */

export const THEMES = {
  parchment: {
    label: '중세·양피지',
    bg:      '#1a1712',   // 카드 바탕
    panel:   '#221e17',   // 안쪽 패널
    panel2:  '#2b2519',   // 더 밝은 패널 (선택지 항목 등)
    accent:  '#c8973f',   // 금색 강조
    accent2: '#8a6a2c',   // 어두운 금색 (선, 테두리)
    ink:     '#ece7db',   // 본문 글자
    ink2:    '#b3a894',   // 보조 글자
    ink3:    '#867c69',   // 흐린 글자
    line:    '#3d3529',   // 구분선
    ok:      '#8fb254',
    warn:    '#d99a3a',
    bad:     '#c26a63',
    serif:   '"Nanum Myeongjo", Batang, "바탕", serif',
    display: '"Cinzel", "Nanum Myeongjo", Batang, serif',
    sans:    '"Noto Sans KR", "Malgun Gothic", sans-serif'
  }
};

/** 현재 적용 중인 톤. setTheme 으로 교체합니다. */
export let T = THEMES.parchment;

export function setTheme(key) {
  if (THEMES[key]) T = THEMES[key];
  return T;
}
