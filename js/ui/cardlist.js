/**
 * 가운데 "회차 구성" 목록.
 * · 팔레트에서 끌어다 놓으면 그 자리에 추가
 * · 목록 안에서 끌면 순서 변경
 */
import { BY_ID } from '../cards/registry.js';
import { state, addCard, moveCard, removeCard, duplicateCard, select } from '../state.js';
import { DRAG_TYPE } from './palette.js';

const INDEX_TYPE = 'application/x-card-index';
let listEl, zoneEl, marker;

export function mountCardList(list, zone) {
  listEl = list;
  zoneEl = zone;

  marker = document.createElement('div');
  marker.className = 'dropline';

  const onOver = e => {
    const types = [...(e.dataTransfer?.types || [])];
    if (!types.includes(DRAG_TYPE) && !types.includes(INDEX_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = types.includes(INDEX_TYPE) ? 'move' : 'copy';
    zone.classList.add('over');
    showMarker(insertionIndex(e.clientY));
  };

  const onLeave = e => {
    if (e.relatedTarget && zone.contains(e.relatedTarget)) return;
    zone.classList.remove('over');
    marker.remove();
  };

  const onDrop = e => {
    const types = [...(e.dataTransfer?.types || [])];
    if (!types.includes(DRAG_TYPE) && !types.includes(INDEX_TYPE)) return;
    e.preventDefault();
    const at = insertionIndex(e.clientY);
    zone.classList.remove('over');
    marker.remove();

    if (types.includes(INDEX_TYPE)) {
      const from = +e.dataTransfer.getData(INDEX_TYPE);
      moveCard(from, from < at ? at - 1 : at);
    } else {
      addCard(e.dataTransfer.getData(DRAG_TYPE), at);
    }
  };

  zone.addEventListener('dragover', onOver);
  zone.addEventListener('dragleave', onLeave);
  zone.addEventListener('drop', onDrop);
}

function items() { return [...listEl.querySelectorAll('.citem')]; }

function insertionIndex(clientY) {
  const rows = items();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return i;
  }
  return rows.length;
}

function showMarker(at) {
  const rows = items();
  if (at >= rows.length) listEl.appendChild(marker);
  else listEl.insertBefore(marker, rows[at]);
}

export function renderCardList() {
  listEl.innerHTML = '';
  document.getElementById('emptyhint').style.display = state.cards.length ? 'none' : '';

  state.cards.forEach((card, i) => {
    const def = BY_ID[card.type];
    const el = document.createElement('div');
    el.className = 'citem' + (card.id === state.selId ? ' sel' : '');
    el.draggable = true;
    el.style.borderLeftColor = def?.accent || 'var(--line)';
    el.innerHTML = `
      <span class="no"></span>
      <span class="lb"></span>
      <span class="ty"></span>
      <button class="mini" data-act="dup" title="복제">⧉</button>
      <button class="mini" data-act="del" title="삭제">✕</button>`;
    el.querySelector('.no').textContent = i + 1;
    el.querySelector('.lb').textContent = (def?.label(card) || '').trim() || def?.name || card.type;
    el.querySelector('.ty').textContent = def?.name || card.type;

    el.addEventListener('click', e => {
      const act = e.target.dataset?.act;
      if (act === 'del') { e.stopPropagation(); removeCard(card.id); return; }
      if (act === 'dup') { e.stopPropagation(); duplicateCard(card.id); return; }
      select(card.id);
    });

    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData(INDEX_TYPE, String(i));
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('drag');
    });
    el.addEventListener('dragend', () => { el.classList.remove('drag'); marker.remove(); });

    listEl.appendChild(el);
  });
}
