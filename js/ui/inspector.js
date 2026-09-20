/**
 * 오른쪽 "카드 속성" 폼.
 * 카드 모듈의 fields 스키마를 읽어 폼을 자동으로 만듭니다.
 * → 새 카드를 추가할 때 이 파일은 건드릴 필요가 없습니다.
 */
import { BY_ID } from '../cards/registry.js';
import { state, selected, patch, patchMany, cardOf } from '../state.js';
import { readImageFile, firstImageFrom } from '../io/files.js';
import { parseSteamText, mergeStats } from '../io/steamtext.js';
import { appIdFrom as appIdFromUrl } from '../io/steamapi.js';
import { applySteam, rememberSteam, rememberedSteam } from '../io/steamlink.js';
import { makeImageBox } from './imagebox.js';
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

  const firstImage = flatFields(def.fields).find(f => f.t === 'image');
  if (firstImage && (!pasteTarget || pasteTarget.cardId !== card.id)) {
    pasteTarget = { cardId: card.id, key: firstImage.k };
  }

  for (const f of def.fields) root.appendChild(buildField(card, f, def));
}

/** 접어 둔 것 안쪽까지 훑습니다. */
function flatFields(fields) {
  return fields.flatMap(f => (f.t === 'fold' ? flatFields(f.fields || []) : [f]));
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

function buildField(card, f, def) {
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

    // 표지와 게임 정보가 같은 칸을 씁니다. 누르면 둘 다 채워집니다.
    case 'steam':
    case 'fetch':   return steamField(card, f);
    case 'paste':   return pasteField(card, f);
    case 'fold':    return foldField(card, f, def);
    case 'image':   return imageField(card, f, v, def);
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

/* ── 스팀 상점 주소 한 칸 ───────────────────────────────── */
const PROXY_KEY = 'aar.useProxy';
/** 기본은 켜 둡니다. 꺼 본 사람만 꺼진 채로 기억합니다. */
const proxyOn = () => {
  try { return localStorage.getItem(PROXY_KEY) !== '0'; } catch { return true; }
};

/**
 * 표지 카드와 게임 정보 카드가 같이 쓰는 칸입니다.
 * 어느 쪽에서 눌러도 표지 사진과 게임 정보를 한꺼번에 채웁니다. (js/io/steamlink.js)
 * 넣은 주소는 문서에 남아서 다른 카드에서도 그대로 보입니다.
 */
function steamField(card, f) {
  const box = document.createElement('div');
  box.className = 'steamrow';

  const inp = document.createElement('input');
  inp.value = rememberedSteam();
  inp.placeholder = f.ph || 'store.steampowered.com/app/… 또는 앱 번호';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '가져오기';

  const opts = document.createElement('div');
  opts.className = 'fetchopts';
  const lab = document.createElement('label');
  const prox = document.createElement('input');
  prox.type = 'checkbox';
  prox.checked = proxyOn();
  const sp = document.createElement('span');
  sp.textContent = '가격·한국어 평가까지 (조금 느립니다)';
  lab.append(prox, sp);
  opts.appendChild(lab);
  prox.addEventListener('change', () => {
    try { localStorage.setItem(PROXY_KEY, prox.checked ? '1' : '0'); } catch { /* noop */ }
  });

  const run = async () => {
    const id = appIdFromUrl(inp.value);
    if (!id) return toast('스팀 상점 주소나 앱 번호를 넣어 주세요.');

    rememberSteam(inp.value);
    btn.disabled = true;
    const was = btn.textContent;
    btn.textContent = '받는 중…';
    try {
      const r = await applySteam(id, { useProxy: prox.checked, from: card.id });
      if (!r.found) return toast('그 번호의 게임을 찾지 못했습니다.', 3200);
      if (!r.filled.length) return toast('채울 것이 없습니다.', 3000);

      toast(`${r.filled.join(', ')} 를 채웠습니다.`
            + (r.partial ? ' (가격·한국어 평가는 못 받았습니다)' : ''), 4200);
    } catch {
      toast('받지 못했습니다. 잠시 뒤에 다시 해 보세요.');
    } finally {
      btn.disabled = false;
      btn.textContent = was;
    }
  };

  btn.addEventListener('click', run);
  inp.addEventListener('input', () => rememberSteam(inp.value));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(); } });

  box.append(inp, btn);

  const all = document.createElement('div');
  all.append(box, opts);
  if (f.note) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = f.note;
    all.appendChild(note);
  }
  return wrapField(f.label, all);
}

/* ── 상점 페이지 글 붙여넣기 ────────────────────────────── */
/**
 * 스팀 상점 페이지를 끌어 복사해서 여기에 붙이면 항목을 알아서 채웁니다.
 * 상점 API 는 CORS 로 막혀 있지만, 글은 페이지에 그대로 있으니 읽기만 하면 됩니다.
 */
function pasteField(card, f) {
  const box = document.createElement('div');
  box.className = 'pastebox';

  const ta = document.createElement('textarea');
  ta.rows = 3;
  ta.placeholder = f.ph || '상점 페이지에서 끌어 복사한 뒤 여기에 붙여넣으세요 (Ctrl+V)';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '항목 채우기';

  const run = () => {
    const raw = ta.value;
    if (!clean(raw)) return toast('붙여넣은 글이 없습니다.');

    const found = parseSteamText(raw);
    const cur = cardOf(card.id) || card;
    const { stats, filled } = mergeStats(cur.stats, found, { overwrite: true });

    if (!filled.length) {
      return toast('읽을 항목을 못 찾았습니다. 상점 페이지 오른쪽 정보 상자까지 긁어 주세요.', 4000);
    }

    patchMany(card.id, { stats });
    ta.value = '';
    toast(`${filled.join(', ')} 를 채웠습니다.`, 3600);
  };

  btn.addEventListener('click', run);
  // 붙여넣자마자 바로 읽습니다. 단추를 또 누르게 하면 번거롭습니다.
  ta.addEventListener('paste', () => setTimeout(run, 0));

  box.append(ta, btn);

  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = f.note || '';
  return wrapField(f.label, box, f.note ? note : null);
}

const clean = s => String(s ?? '').trim();

/* ── 접어 두는 묶음 ─────────────────────────────────────── */
/** 자주 안 건드리는 설정을 숨겨 둡니다. 접은 상태는 카드 종류별로 기억합니다. */
function foldField(card, f, def) {
  const box = document.createElement('div');
  box.className = 'fold';

  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'fold-head';
  head.innerHTML = `<span class="caret">▾</span><span class="nm"></span>`;
  head.querySelector('.nm').textContent = f.label || '자세한 설정';

  const body = document.createElement('div');
  body.className = 'fold-body';
  for (const sub of f.fields || []) body.appendChild(buildField(card, sub, def));

  const key = `aar-template/fold/${card.type}/${f.label}`;
  let open = false;
  try { open = localStorage.getItem(key) === '1'; } catch { /* 기본은 접힘 */ }

  const apply = () => {
    box.classList.toggle('closed', !open);
    head.setAttribute('aria-expanded', String(open));
  };
  head.addEventListener('click', () => {
    open = !open;
    try { localStorage.setItem(key, open ? '1' : '0'); } catch { /* noop */ }
    apply();
  });
  apply();

  box.append(head, body);
  return box;
}

/* ── 이미지 칸 ──────────────────────────────────────────── */
function imageField(card, f, v, def) {
  const box = document.createElement('div');
  box.className = 'imgfield';

  const apply = async file => {
    try {
      // 새 이미지를 넣으면 이전 확대·위치는 의미가 없으므로 되돌립니다.
      if (f.tf) patch(card.id, f.tf, { s: 1, x: 0, y: 0 });
      patch(card.id, f.k, await readImageFile(file));
    } catch (e) {
      toast(e.message);
    }
  };

  // 사진이 이미 있으면 미리보기만 둡니다.
  // 지우기는 미리보기 사진의 오른쪽 위 ✕ 로, 바꾸기는 지운 뒤 다시 넣으면 됩니다.
  if (v) {
    if (f.tf) {
      box.appendChild(makeImageBox(card, def, f, (k, val) => patch(card.id, k, val)));
    } else {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = v;
      box.appendChild(img);
    }
    return wrapField(f.label, box);
  }

  const drop = document.createElement('div');
  drop.className = 'drop';
  drop.innerHTML = '클릭해서 고르기<br>또는 끌어다 놓기 · Ctrl+V 로 붙여넣기';

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
  // 폼을 다시 그리지 않고 여러 칸을 잇달아 고쳐도 앞의 수정이 날아가지 않도록,
  // 저장 직전에 상태에서 최신 배열을 다시 읽습니다.
  const live = () => {
    const cur = cardOf(card.id)?.[f.k];
    return Array.isArray(cur) ? cur : arr;
  };
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
      const next = [...live()]; next[i] = inp.value;
      patch(card.id, f.k, next);
    });
    row.append(n, inp, miniBtn('↑', () => swap(card, f, live(), i, i - 1)));
    row.append(miniBtn('↓', () => swap(card, f, live(), i, i + 1)));
    row.append(miniBtn('✕', () => patch(card.id, f.k, live().filter((_, j) => j !== i))));
    box.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'ghost tiny';
  add.textContent = f.add || '항목 추가';
  add.addEventListener('click', () => patch(card.id, f.k, [...live(), '']));
  box.appendChild(add);

  return wrapField(f.label, box);
}

/* ── 라벨 / 값 쌍 목록 ──────────────────────────────────── */
function pairsField(card, f, v) {
  const arr = Array.isArray(v) ? v : [];
  const live = () => {
    const cur = cardOf(card.id)?.[f.k];
    return Array.isArray(cur) ? cur : arr;
  };
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
      const next = live().map((p, j) => j === i ? { ...p, l: a.value } : p);
      patch(card.id, f.k, next);
    });
    const b = document.createElement('input');
    b.className = 'narrow';
    if (f.numeric) {
      b.type = 'number';
      b.min = 0;
      // 만점처럼 다른 칸이 정하는 상한이 있으면 그 값을 씁니다.
      if (f.maxFrom && card[f.maxFrom] != null) b.max = card[f.maxFrom];
    }
    b.value = pair.v ?? '';
    b.addEventListener('input', () => {
      const next = live().map((p, j) => j === i ? { ...p, v: b.value } : p);
      patch(card.id, f.k, next);
    });
    row.append(a, b, miniBtn('✕', () => patch(card.id, f.k, live().filter((_, j) => j !== i))));
    box.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'ghost tiny';
  add.textContent = f.add || '항목 추가';
  add.addEventListener('click', () => patch(card.id, f.k, [...live(), { l: '', v: f.numeric ? '0' : '' }]));
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
