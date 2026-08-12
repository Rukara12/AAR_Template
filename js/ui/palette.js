/** 왼쪽 카드 팔레트. 타일을 끌어다 놓거나 클릭해서 카드를 추가합니다. */
import { GROUPS } from '../cards/registry.js';
import { addCard } from '../state.js';

export const DRAG_TYPE = 'application/x-card-type';

export function mountPalette(root) {
  root.innerHTML = '';
  for (const g of GROUPS) {
    const h = document.createElement('h4');
    h.className = 'pgroup';
    h.textContent = g.name;
    root.appendChild(h);

    for (const def of g.items) {
      const el = document.createElement('div');
      el.className = 'ptile';
      el.draggable = true;
      el.title = `${def.name} — ${def.desc}`;
      el.innerHTML = `
        <span class="ic" style="background:${def.accent}"></span>
        <span class="tx"><span class="nm"></span><span class="ds"></span></span>`;
      el.querySelector('.nm').textContent = def.name;
      el.querySelector('.ds').textContent = def.desc;

      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData(DRAG_TYPE, def.id);
        e.dataTransfer.setData('text/plain', def.id);
        e.dataTransfer.effectAllowed = 'copy';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('click', () => addCard(def.id));

      root.appendChild(el);
    }
  }
}
