/**
 * 왼쪽 카드 팔레트. 타일을 끌어다 놓거나 클릭해서 카드를 추가합니다.
 * 묶음 제목을 누르면 접힙니다. 접은 상태는 기억합니다.
 */
import { GROUPS } from '../cards/registry.js';
import { addCard } from '../state.js';
import { showPreview, hidePreview } from './preview.js';

export const DRAG_TYPE = 'application/x-card-type';

const KEY = 'aar-template/palette-closed';

function readClosed() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw)) return new Set(raw);
  } catch { /* 저장된 게 없으면 기본값 */ }
  return new Set(GROUPS.filter(g => g.collapsed).map(g => g.name));
}

function writeClosed(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

/** @param popHost 견본이 뜰 기준 요소 (보통 #app) */
export function mountPalette(root, popHost) {
  const closed = readClosed();
  root.innerHTML = '';

  for (const g of GROUPS) {
    const sec = document.createElement('div');
    sec.className = 'pgroup';

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'pgroup-head';
    head.innerHTML = `<span class="caret">▾</span><span class="nm"></span><span class="cnt"></span>`;
    head.querySelector('.nm').textContent = g.name;
    head.querySelector('.cnt').textContent = g.items.length;

    const body = document.createElement('div');
    body.className = 'pgroup-body';

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
        hidePreview();
        e.dataTransfer.setData(DRAG_TYPE, def.id);
        e.dataTransfer.setData('text/plain', def.id);
        e.dataTransfer.effectAllowed = 'copy';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('click', () => { hidePreview(); addCard(def.id); });

      el.addEventListener('mouseenter', () => showPreview(def, el, popHost));
      el.addEventListener('mouseleave', hidePreview);

      body.appendChild(el);
    }

    const apply = () => {
      const off = closed.has(g.name);
      sec.classList.toggle('closed', off);
      head.setAttribute('aria-expanded', String(!off));
    };
    head.addEventListener('click', () => {
      if (closed.has(g.name)) closed.delete(g.name);
      else { closed.add(g.name); hidePreview(); }
      writeClosed(closed);
      apply();
    });
    apply();

    sec.append(head, body);
    root.appendChild(sec);
  }
}
