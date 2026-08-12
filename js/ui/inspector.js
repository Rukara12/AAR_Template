/**
 * 오른쪽 "카드 속성" 폼.
 * 카드 모듈의 fields 스키마를 읽어 폼을 자동으로 만듭니다.
 * → 새 카드를 추가할 때 이 파일은 건드릴 필요가 없습니다.
 */
import { BY_ID } from '../cards/registry.js';
import { state, selected, patch } from '../state.js';
import { readImageFile, firstImageFrom } from '../io/files.js';
import { toast } from './toast.js';

/** 붙여넣기(Ctrl+V) 대상이 되는 이미지 칸 */
export let pasteTarget = null;
export function setPasteTarget(t) { pasteTarget = t; }

export function renderInspector(root) {
  const card = selected();
  root.innerHTML = '';

  if (!card) {
    root.innerHTML = `<p class="hint">왼쪽 팔레트에서 카드를 끌어다 놓고, 목록에서 카드를 고르면 여기에 속성이 나옵니다.</p>`;
    pasteTarget = null;
    return;
  }

  const def = BY_ID[card.type];
  const head = document.createElement('div');
  head.className = 'insphead';
  head.innerHTML = `<span class="dot" style="background:${def.accent}"></span><b></b><span class="hint2"></span>`;
  head.querySelector('b').textContent = def.name;
  head.querySelector('.hint2').textContent = def.desc;
  root.appendChild(head);

  const firstImage = def.fields.find(f => f.t === 'image');
  if (firstImage && (!pasteTarget || pasteTarget.cardId !== card.id)) {
    pasteTarget = { cardId: card.id, key: firstImage.k };
  }

  for (const f of def.fields) root.appendChild(buildField(card, f));
}

function wrapField(label, node, extra) {
  const d = document.createElement('div');
  d.className = 'field';
  if (label) {
    const l = document.createElement('label');
    l.textContent = label;
    d.appendChild(l);
  }
  d.appendChild(node);
  if (extra) d.appendChild(extra);
  return d;
}

function buildField(card, f) {
  const v = card[f.k];

  switch (f.t) {
    case 'note': {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = f.text;
      return p;
    }

    case 'text': {
      const i = document.createElement('input');
      i.value = v ?? '';
      i.placeholder = f.ph || '';
      i.addEventListener('input', () => patch(card.id, f.k, i.value));
      return wrapField(f.label, i);
    }

    case 'textarea': {
      const t = document.createElement('textarea');
      t.rows = f.rows || 4;
      t.value = v ?? '';
      t.placeholder = f.ph || '';
      t.addEventListener('input', () => patch(card.id, f.k, t.value));
      return wrapField(f.label, t);
    }

    case 'number': {
      const i = document.createElement('input');
      i.type = 'number';
      if (f.min != null) i.min = f.min;
      if (f.max != null) i.max = f.max;
      if (f.step != null) i.step = f.step;
      i.value = v ?? '';
      i.addEventListener('input', () => patch(card.id, f.k, +i.value));
      return wrapField(f.label, i);
    }

    case 'range': {
      const row = document.createElement('div');
      row.className = 'rangerow';
      const i = document.createElement('input');
      i.type = 'range';
      i.min = f.min ?? 0; i.max = f.max ?? 1; i.step = f.step ?? 0.05;
      i.value = v ?? 0;
      const out = document.createElement('span');
      out.className = 'rangeval';
      out.textContent = Number(i.value).toFixed(2);
      i.addEventListener('input', () => {
        out.textContent = Number(i.value).toFixed(2);
        patch(card.id, f.k, +i.value);
      });
      row.append(i, out);
      return wrapField(f.label, row);
    }

    case 'select': {
      const s = document.createElement('select');
      for (const [val, lab] of f.opts) {
        const o = document.createElement('option');
        o.value = val; o.textContent = lab;
        s.appendChild(o);
      }
      s.value = v ?? f.opts[0][0];
      s.addEventListener('change', () => patch(card.id, f.k, s.value));
      return wrapField(f.label, s);
    }

    case 'toggle': {
      const lab = document.createElement('label');
      lab.className = 'togglerow';
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.checked = !!v;
      i.addEventListener('change', () => patch(card.id, f.k, i.checked));
      const sp = document.createElement('span');
      sp.textContent = f.label;
      lab.append(i, sp);
      const d = document.createElement('div');
      d.className = 'field';
      d.appendChild(lab);
      return d;
    }

    case 'image':   return imageField(card, f, v);
    case 'strlist': return strListField(card, f, v);
    case 'pairs':   return pairsField(card, f, v);

    default: {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = `알 수 없는 필드 타입: ${f.t}`;
      return p;
    }
  }
}

/* ── 이미지 칸 ──────────────────────────────────────────── */
function imageField(card, f, v) {
  const box = document.createElement('div');
  box.className = 'imgfield';

  const apply = async file => {
    try {
      patch(card.id, f.k, await readImageFile(file));
    } catch (e) {
      toast(e.message);
    }
  };

  if (v) {
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = v;
    box.appendChild(img);
    const del = document.createElement('button');
    del.className = 'ghost tiny';
    del.textContent = '이미지 지우기';
    del.addEventListener('click', () => patch(card.id, f.k, null));
    box.appendChild(del);
  }

  const drop = document.createElement('div');
  drop.className = 'drop';
  drop.innerHTML = v
    ? '다른 이미지로 바꾸기 — 클릭 · 끌어놓기 · Ctrl+V'
    : '클릭해서 고르기<br>또는 끌어다 놓기 · Ctrl+V 로 붙여넣기';

  drop.addEventListener('click', () => {
    setPasteTarget({ cardId: card.id, key: f.k });
    const picker = document.getElementById('filePick');
    picker.value = '';
    picker.onchange = () => { if (picker.files[0]) apply(picker.files[0]); };
    picker.click();
  });
  drop.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    drop.classList.add('over');
    setPasteTarget({ cardId: card.id, key: f.k });
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('over');
    const file = firstImageFrom(e.dataTransfer);
    if (file) apply(file);
  });

  box.appendChild(drop);
  return wrapField(f.label, box);
}

/* ── 문자열 목록 ────────────────────────────────────────── */
function strListField(card, f, v) {
  const arr = Array.isArray(v) ? v : [];
  const box = document.createElement('div');

  arr.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'listrow';
    const n = document.createElement('span');
    n.className = 'rowno';
    n.textContent = i + 1;
    const inp = document.createElement('input');
    inp.value = item;
    inp.placeholder = f.ph || '';
    inp.addEventListener('input', () => {
      const next = [...arr]; next[i] = inp.value;
      patch(card.id, f.k, next);
    });
    row.append(n, inp, miniBtn('↑', () => swap(card, f, arr, i, i - 1)));
    row.append(miniBtn('↓', () => swap(card, f, arr, i, i + 1)));
    row.append(miniBtn('✕', () => patch(card.id, f.k, arr.filter((_, j) => j !== i))));
    box.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'ghost tiny';
  add.textContent = f.add || '항목 추가';
  add.addEventListener('click', () => patch(card.id, f.k, [...arr, '']));
  box.appendChild(add);

  return wrapField(f.label, box);
}

/* ── 라벨 / 값 쌍 목록 ──────────────────────────────────── */
function pairsField(card, f, v) {
  const arr = Array.isArray(v) ? v : [];
  const box = document.createElement('div');

  const head = document.createElement('div');
  head.className = 'pairhead';
  head.innerHTML = `<span></span><span></span>`;
  head.children[0].textContent = f.a || '항목';
  head.children[1].textContent = f.b || '값';
  box.appendChild(head);

  arr.forEach((pair, i) => {
    const row = document.createElement('div');
    row.className = 'listrow';
    const a = document.createElement('input');
    a.value = pair.l ?? '';
    a.addEventListener('input', () => {
      const next = arr.map((p, j) => j === i ? { ...p, l: a.value } : p);
      patch(card.id, f.k, next);
    });
    const b = document.createElement('input');
    b.className = 'narrow';
    if (f.numeric) { b.type = 'number'; b.min = 0; }
    b.value = pair.v ?? '';
    b.addEventListener('input', () => {
      const next = arr.map((p, j) => j === i ? { ...p, v: b.value } : p);
      patch(card.id, f.k, next);
    });
    row.append(a, b, miniBtn('✕', () => patch(card.id, f.k, arr.filter((_, j) => j !== i))));
    box.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'ghost tiny';
  add.textContent = f.add || '항목 추가';
  add.addEventListener('click', () => patch(card.id, f.k, [...arr, { l: '', v: f.numeric ? '0' : '' }]));
  box.appendChild(add);

  return wrapField(f.label, box);
}

function swap(card, f, arr, i, j) {
  if (j < 0 || j >= arr.length) return;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  patch(card.id, f.k, next);
}

function miniBtn(label, fn) {
  const b = document.createElement('button');
  b.className = 'mini';
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}
