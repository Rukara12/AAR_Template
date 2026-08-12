/** 오른쪽 미리보기. 회차 전체를 위에서 아래로 실제 출력 그대로 보여 줍니다. */
import { state, select } from '../state.js';
import { renderCard } from '../canvas/render.js';
import { W } from '../canvas/layout.js';

let timer = null;
let cache = [];

/** 렌더 결과 캔버스 목록 (내보내기에서 재사용) */
export const lastCanvases = () => cache;

/** 글자를 칠 때마다 전부 다시 그리면 무거우므로 잠깐 모았다가 그립니다. */
export function renderStage(root, metaEl) {
  clearTimeout(timer);
  timer = setTimeout(() => draw(root, metaEl), 90);
}

function draw(root, metaEl) {
  root.innerHTML = '';
  cache = [];

  if (!state.cards.length) {
    root.innerHTML = `<div class="stageempty">
      카드를 추가하면 여기에 실제 출력 이미지가 그대로 보입니다.<br>
      보이는 그대로 PNG 로 저장됩니다.
    </div>`;
    metaEl.textContent = '';
    return;
  }

  let total = 0;
  state.cards.forEach((card, i) => {
    const cv = renderCard(card);
    cache.push(cv);
    total += cv.height;

    const wrap = document.createElement('div');
    wrap.className = 'shot' + (card.id === state.selId ? ' sel' : '');
    const no = document.createElement('span');
    no.className = 'shotno';
    no.textContent = i + 1;
    wrap.append(no, cv);
    wrap.addEventListener('click', () => select(card.id));
    root.appendChild(wrap);
  });

  const mb = (total * W * 4) / 1024 / 1024;
  metaEl.textContent =
    `카드 ${state.cards.length}장 · 출력 폭 ${W}px · 전체 높이 ${total.toLocaleString()}px` +
    (mb > 40 ? ' · 이미지가 꽤 큽니다. 합본 최대 높이를 낮춰 나눠 올리세요.' : '');
}
