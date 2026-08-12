/**
 * 가운데 미리보기. 회차 전체를 위에서 아래로 실제 출력 그대로 보여 주고,
 * 그 위에서 바로 고칠 수 있게 합니다. (js/ui/direct.js)
 *
 * 카드 목록이 그대로면 요소를 새로 만들지 않고 그림만 갱신합니다.
 * 그래야 열려 있는 글 입력칸이 사라지지 않습니다.
 */
import { state } from '../state.js';
import { renderInto } from '../canvas/render.js';
import { W } from '../canvas/layout.js';
import { currentScale } from './uiscale.js';
import { attachDirect, syncEditor, closeEditor } from './direct.js';

let timer = null;
const nodes = new Map();   // cardId → { wrap, cv }

export function renderStage(root, metaEl) {
  clearTimeout(timer);
  timer = setTimeout(() => draw(root, metaEl), 70);
}

function draw(root, metaEl) {
  const ids = state.cards.map(c => c.id).join(',');
  const sameShape = root.dataset.ids === ids;

  if (!state.cards.length) {
    root.innerHTML = `<div class="stageempty">
      왼쪽에서 카드를 끌어다 놓으면 여기에 실제 출력 이미지가 그대로 보입니다.<br>
      글은 <b>눌러서 그 자리에서</b>, 이미지는 <b>끌어서</b> 고칩니다.
    </div>`;
    root.dataset.ids = '';
    nodes.clear();
    metaEl.textContent = '';
    return;
  }

  // 카드가 늘거나 줄면 요소를 새로 만듭니다. 열려 있던 입력칸은 먼저 정리합니다.
  if (!sameShape) { closeEditor(); root.innerHTML = ''; nodes.clear(); root.dataset.ids = ids; }

  // 화면 크기를 올리면 캔버스도 늘어나 흐려지므로 그만큼 촘촘히 그립니다.
  // 내보낼 때는 따로 다시 그리므로 결과물에는 영향이 없습니다.
  const ss = Math.min(2, Math.max(1, currentScale()));

  let total = 0;
  state.cards.forEach((card, i) => {
    let node = nodes.get(card.id);

    if (!node) {
      const wrap = document.createElement('div');
      wrap.className = 'shot';
      const no = document.createElement('span');
      no.className = 'shotno';
      const cv = document.createElement('canvas');
      wrap.append(no, cv);
      root.appendChild(wrap);
      attachDirect(wrap, cv, card.id);
      node = { wrap, cv, no };
      nodes.set(card.id, node);
    }

    renderInto(node.cv, card, ss);
    node.cv.style.width = `${W}px`;
    node.no.textContent = i + 1;
    node.wrap.classList.toggle('sel', card.id === state.selId);
    syncEditor(card.id, node.cv);
    total += node.cv.logicalHeight;
  });

  metaEl.textContent = `카드 ${state.cards.length}장 · 이어 붙인 높이 ${total.toLocaleString()}px (850px 기준)`;
}

/** 카드 목록에서 고른 카드를 화면 안으로 끌어옵니다. */
export function scrollToCard(id) {
  nodes.get(id)?.wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
