/** 조작법 안내. ? 키나 상단바 물음표로 엽니다. */
import { showDialog } from './dialog.js';

const rows = (title, list) => `
  <h3 class="help-h">${title}</h3>
  <table class="help">${list.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;

export function openHelpDialog() {
  showDialog({
    title: '조작법',
    wide: true,
    cancel: '닫기',
    html:
      rows('미리보기에서 바로 고치기', [
        ['글을 누르기', '그 자리에 입력칸이 열립니다'],
        ['<kbd>Esc</kbd>', '고치던 것 취소'],
        ['<kbd>Ctrl</kbd>+<kbd>Enter</kbd>', '고치기 끝내기'],
        ['이미지를 끌기', '보이는 위치 옮기기'],
        ['<kbd>Alt</kbd>+휠', '이미지 확대·축소 (그냥 휠은 화면 넘기기)'],
        ['이미지 더블클릭', '확대·위치 되돌리기'],
        ['이미지 오른쪽 위 <b>✕</b>', '그 사진만 지우기'],
        ['카드 오른쪽 위 <b>✕</b>', '카드째 지우기']
      ]) +
      rows('카드 다루기', [
        ['팔레트 타일을 끌기', '원하는 자리에 카드 넣기 (클릭하면 맨 아래)'],
        ['목록에서 끌기', '순서 바꾸기'],
        ['<kbd>Ctrl</kbd>+클릭', '여러 장 골라 잡기'],
        ['<kbd>Shift</kbd>+클릭', '여기까지 한 번에 고르기'],
        ['<kbd>Alt</kbd>+<kbd>↑</kbd> <kbd>↓</kbd>', '고른 카드를 한 칸 위·아래로'],
        ['<kbd>Delete</kbd>', '고른 카드 지우기']
      ]) +
      rows('이미지 넣기', [
        ['창에 파일을 떨어뜨리기', '여러 장이면 그 수만큼 스샷 카드가 생깁니다'],
        ['<kbd>Ctrl</kbd>+<kbd>V</kbd>', '고른 카드에 붙여넣기'],
        ['속성 패널의 상자', '클릭해서 파일 고르기']
      ]) +
      rows('그 밖에', [
        ['<kbd>Ctrl</kbd>+<kbd>Z</kbd>', '되돌리기'],
        ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>', '다시하기'],
        ['<kbd>Ctrl</kbd>+<kbd>S</kbd>', '프로젝트를 파일로 저장'],
        ['<kbd>?</kbd>', '이 창 열기'],
        ['상단바 <b>− 100% +</b>', '편집기 전체 크기 (결과물과 무관)']
      ])
  });
}
