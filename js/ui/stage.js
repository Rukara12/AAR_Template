/**
 * 가운데 미리보기. 회차 전체를 위에서 아래로 실제 출력 그대로 보여 주고,
 * 그 위에서 바로 고칠 수 있게 합니다. (js/ui/direct.js)
 *
 * 카드 목록이 그대로면 요소를 새로 만들지 않고 그림만 갱신합니다.
 * 그래야 열려 있는 글 입력칸이 사라지지 않습니다.
 */
import { state, isSelected, removeCard } from '../state.js';
import { renderInto } from '../canvas/render.js';
import { W } from '../canvas/layout.js';
import { currentScale } from './uiscale.js';
import { attachDirect, syncEditor, syncZoneDels, closeEditor } from './direct.js';

let timer = null;
const nodes = new Map();   // cardId → { wrap, cv }

export function renderStage(root) {
  clearTimeout(timer);
  timer = setTimeout(() => draw(root), 70);
}

function draw(root) {
  const ids = state.cards.map(c => c.id).join(',');
  const sameShape = root.dataset.ids === ids;

  if (!state.cards.length) {
    root.innerHTML = `<div class="stageempty">
      왼쪽에서 카드를 끌어다 놓으면 여기에 실제 출력 이미지가 그대로 보입니다.<br>
      글은 <b>눌러서 그 자리에서</b>, 이미지는 <b>끌어서</b> 고칩니다.
    </div>`;
    root.dataset.ids = '';
    nodes.clear();
    return;
  }

  // 카드가 늘거나 줄면 요소를 새로 만듭니다. 열려 있던 입력칸은 먼저 정리합니다.
  if (!sameShape) { closeEditor(); root.innerHTML = ''; nodes.clear(); root.dataset.ids = ids; }

  // 화면 크기를 올리면 캔버스도 늘어나 흐려지므로 그만큼 촘촘히 그립니다.
  // 내보낼 때는 따로 다시 그리므로 결과물에는 영향이 없습니다.
  const ss = Math.min(2, Math.max(1, currentScale()));

  state.cards.forEach((card, i) => {
    let node = nodes.get(card.id);

    if (!node) {
      const wrap = document.createElement('div');
      wrap.className = 'shot';
      const no = document.createElement('span');
      no.className = 'shotno';

      // 지우기 단추. 캔버스가 아니라 그 위에 얹는 요소라 결과물에는 안 나갑니다.
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'shotdel';
      del.textContent = '✕';
      del.title = '이 카드 지우기';
      del.setAttribute('aria-label', '이 카드 지우기');
      del.addEventListener('click', e => { e.stopPropagation(); removeCard(card.id); });

      const cv = document.createElement('canvas');
      wrap.append(no, cv, del);
      root.appendChild(wrap);
      attachDirect(wrap, cv, card.id);
      node = { wrap, cv, no };
      nodes.set(card.id, node);
    }

    renderInto(node.cv, card, ss);
    node.cv.style.width = `${W}px`;
    node.no.textContent = i + 1;
    node.wrap.classList.toggle('sel', isSelected(card.id));
    syncEditor(card.id, node.cv);
    syncZoneDels(node.cv);
  });

}

/** 카드 목록에서 고른 카드를 화면 안으로 끌어옵니다. */
export function scrollToCard(id) {
  nodes.get(id)?.wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
