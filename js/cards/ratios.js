/** 이미지 카드가 공통으로 쓰는 가로세로 비율 목록. (값 = 가로 ÷ 세로) */
export const RATIO_OPTS = [
  ['auto',   '원본 비율'],
  ['1.7778', '16 : 9'],
  ['1.6',    '16 : 10'],
  ['1.3333', '4 : 3'],
  ['1',      '정사각 1 : 1'],
  ['2.3333', '21 : 9 (와이드)'],
  ['0.75',   '3 : 4 (세로)']
];

/** 고른 비율을 숫자로. '원본 비율' 이면 이미지 자신의 비율을 씁니다. */
export function ratioOf(value, naturalWH) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : (naturalWH || 16 / 9);
}
