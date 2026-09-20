/**
 * 왼쪽 "문서 구성" 목록.
 * · 팔레트에서 끌어다 놓으면 그 자리에 추가
 * · 목록 안에서 끌면 순서 변경
 * · Ctrl·Shift 클릭으로 여러 장 고르기
 */
import { BY_ID, groupColorOf } from '../cards/registry.js';
import { state, addCard, moveCard, removeCard, removeCards, duplicateCard,
         select, toggleSelect, selectRange, isSelected } from '../state.js';
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

/**
 * 커서를 올렸을 때 보여 줄 글.
 *
 * 이 목록은 «무엇이 어떤 차례로 있는지» 보는 곳이지 내용을 읽는 곳이 아닙니다.
 * 적은 내용을 줄에 같이 흘리면 카드마다 길이가 들쭉날쭉해져서 구성이 안 보입니다.
 * 그래서 줄에는 카드 종류만 두고, 내용은 커서를 올렸을 때만 보여 줍니다.
 */
const TIP_MAX = 60;
function tipOf(def, card) {
  const name = def?.name || card.type;
  const raw = String(def?.label(card) ?? '').replace(/\s+/g, ' ').trim();
  // 빈 카드는 label 이 카드 종류 이름을 그대로 돌려줍니다. 두 번 적을 이유가 없습니다.
  if (!raw || raw === name) return name;
  const body = raw.length > TIP_MAX ? `${raw.slice(0, TIP_MAX)}…` : raw;
  return `${name}\n${body}`;
}

export function renderCardList() {
  listEl.innerHTML = '';
  document.getElementById('emptyhint').style.display = state.cards.length ? 'none' : '';

  state.cards.forEach((card, i) => {
    const def = BY_ID[card.type];
    const el = document.createElement('div');
    el.className = 'citem' + (isSelected(card.id) ? ' sel' : '');
    el.draggable = true;
    el.dataset.type = card.type;
    el.style.borderLeftColor = groupColorOf(card.type);
    el.innerHTML = `
      <span class="no"></span>
      <span class="ty"></span>
      <button class="mini" data-act="dup" title="복제">⧉</button>
      <button class="mini" data-act="del" title="삭제">✕</button>`;
    el.querySelector('.no').textContent = i + 1;
    el.querySelector('.ty').textContent = def?.name || card.type;
    el.title = tipOf(def, card);

    el.addEventListener('click', e => {
      const act = e.target.dataset?.act;
      if (act === 'del') {
        e.stopPropagation();
        if (isSelected(card.id) && state.selIds.length > 1) removeCards(state.selIds);
        else removeCard(card.id);
        return;
      }
      if (act === 'dup') { e.stopPropagation(); duplicateCard(card.id); return; }

      if (e.shiftKey) selectRange(card.id);
      else if (e.ctrlKey || e.metaKey) toggleSelect(card.id);
      else select(card.id);
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
