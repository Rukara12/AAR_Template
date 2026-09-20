/**
 * 앱 상태와 변경 알림, 그리고 되돌리기 이력.
 *
 * ▶ 중요한 규칙: 카드 객체를 그 자리에서 고치지 않습니다.
 *   항상 새 객체로 갈아 끼웁니다. 그래야 이력에 담아 둔 옛 상태가 나중에 덮어써지지 않고,
 *   바뀌지 않은 카드는 객체를 그대로 공유하므로 이력이 메모리를 거의 안 먹습니다.
 *   (이미지가 dataURL 이라 통째로 복사하면 금방 수백 MB 가 됩니다)
 */
import { createCard, normalize } from './cards/registry.js';

const MAX_HISTORY = 120;
/** 같은 칸을 연달아 고치면 이 시간 안에는 한 덩어리로 묶습니다. */
const COALESCE_MS = 800;

export const state = {
  // steam: 이 문서가 다루는 게임의 상점 주소. 표지와 게임 정보 카드가 같이 씁니다.
  meta: { series: '', steam: '', maxH: 6000, outScale: 2, format: 'webp', exportMode: 'merge' },
  cards: [],
  selIds: []          // 여러 장을 고를 수 있습니다. 마지막에 고른 것이 속성 패널 기준
};

/** 속성 패널이 보는 카드 = 마지막에 고른 것 */
Object.defineProperty(state, 'selId', {
  get() { return state.selIds[state.selIds.length - 1] ?? null; },
  set(v) { state.selIds = v ? [v] : []; }
});

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() { for (const fn of listeners) fn(); }

/* ── 조회 ───────────────────────────────────────────────── */
export const cardOf   = id => state.cards.find(c => c.id === id) || null;
export const selected = () => cardOf(state.selId);
export const indexOf  = id => state.cards.findIndex(c => c.id === id);
export const isSelected = id => state.selIds.includes(id);

/* ── 되돌리기 이력 ──────────────────────────────────────── */
const past = [];
const future = [];
let snap = takeSnap();
let lastTag = null, lastAt = 0;

function takeSnap() {
  return { meta: state.meta, cards: state.cards, selIds: state.selIds };
}
function applySnap(s) {
  state.meta = s.meta;
  state.cards = s.cards;
  state.selIds = s.selIds;
}

/**
 * 바뀐 상태를 이력에 남깁니다.
 * @param tag 같은 태그가 잇달아 들어오면 한 덩어리로 묶습니다. (글자 한 자마다 쌓이지 않게)
 */
function commit(tag = null) {
  const now = Date.now();
  const merge = tag && tag === lastTag && now - lastAt < COALESCE_MS;
  if (!merge) {
    past.push(snap);
    if (past.length > MAX_HISTORY) past.shift();
  }
  future.length = 0;
  snap = takeSnap();
  lastTag = tag;
  lastAt = now;
  emit();
}

export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;

export function undo() {
  if (!past.length) return false;
  future.push(snap);
  snap = past.pop();
  applySnap(snap);
  lastTag = null;
  emit();
  return true;
}

export function redo() {
  if (!future.length) return false;
  past.push(snap);
  snap = future.pop();
  applySnap(snap);
  lastTag = null;
  emit();
  return true;
}

function resetHistory() {
  past.length = 0;
  future.length = 0;
  snap = takeSnap();
  lastTag = null;
}

/* ── 편집 ───────────────────────────────────────────────── */
export function addCard(typeId, at = state.cards.length) {
  const card = createCard(typeId);
  const next = [...state.cards];
  next.splice(Math.max(0, Math.min(at, next.length)), 0, card);
  state.cards = next;
  state.selIds = [card.id];
  commit();
  return card;
}

/**
 * 여러 장을 한 번에 넣습니다. (이미지 여러 개를 떨어뜨렸을 때)
 * 항목은 타입 id 이거나 { type, props } 입니다.
 * 값까지 채워서 한 번에 넣어야 되돌리기가 한 번에 취소됩니다.
 */
export function addCards(specs, at = state.cards.length) {
  const made = specs.map(s =>
    typeof s === 'string' ? createCard(s) : { ...createCard(s.type), ...s.props });
  const next = [...state.cards];
  next.splice(Math.max(0, Math.min(at, next.length)), 0, ...made);
  state.cards = next;
  state.selIds = made.map(c => c.id);
  commit();
  return made;
}

export function moveCard(from, to) {
  if (from === to || from < 0 || from >= state.cards.length) return;
  const next = [...state.cards];
  const [c] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, c);
  state.cards = next;
  commit();
}

/** 고른 카드들을 위(-1)나 아래(+1)로 한 칸 옮깁니다. */
export function nudgeSelection(dir) {
  const idxs = state.selIds.map(indexOf).filter(i => i >= 0).sort((a, b) => a - b);
  if (!idxs.length) return;
  const next = [...state.cards];
  if (dir < 0) {
    if (idxs[0] === 0) return;
    for (const i of idxs) [next[i - 1], next[i]] = [next[i], next[i - 1]];
  } else {
    if (idxs[idxs.length - 1] === next.length - 1) return;
    for (const i of [...idxs].reverse()) [next[i + 1], next[i]] = [next[i], next[i + 1]];
  }
  state.cards = next;
  commit();
}

export function removeCard(id) { removeCards([id]); }

export function removeCards(ids) {
  const set = new Set(ids);
  const firstIdx = Math.min(...ids.map(indexOf).filter(i => i >= 0));
  const next = state.cards.filter(c => !set.has(c.id));
  if (next.length === state.cards.length) return;
  state.cards = next;
  state.selIds = next.length ? [next[Math.min(firstIdx, next.length - 1)].id] : [];
  commit();
}

export function duplicateCard(id) {
  const i = indexOf(id);
  if (i < 0) return;
  const copy = { ...structuredClone(state.cards[i]), id: Math.random().toString(36).slice(2, 9) };
  const next = [...state.cards];
  next.splice(i + 1, 0, copy);
  state.cards = next;
  state.selIds = [copy.id];
  commit();
}

/* ── 선택 ───────────────────────────────────────────────── */
/** 선택은 이력에 남기지 않습니다. 되돌리기로 커서만 움직이면 헷갈립니다. */
export function select(id) {
  if (state.selIds.length === 1 && state.selIds[0] === id) return;
  state.selIds = id ? [id] : [];
  snap = takeSnap();
  emit();
}

export function toggleSelect(id) {
  state.selIds = state.selIds.includes(id)
    ? state.selIds.filter(x => x !== id)
    : [...state.selIds, id];
  snap = takeSnap();
  emit();
}

/** 마지막에 고른 것부터 여기까지 한 번에 (Shift+클릭) */
export function selectRange(id) {
  const a = indexOf(state.selId);
  const b = indexOf(id);
  if (a < 0 || b < 0) return select(id);
  const [lo, hi] = a < b ? [a, b] : [b, a];
  state.selIds = state.cards.slice(lo, hi + 1).map(c => c.id);
  snap = takeSnap();
  emit();
}

/* ── 값 고치기 ──────────────────────────────────────────── */
/** 카드 속성 하나를 바꿉니다. 같은 칸을 연달아 고치면 이력에서 한 덩어리로 묶입니다. */
export function patch(id, key, value) {
  const c = cardOf(id);
  if (!c || c[key] === value) return;
  state.cards = state.cards.map(x => (x.id === id ? { ...x, [key]: value } : x));
  commit(`${id}:${key}`);
}

/**
 * 여러 칸을 한 번에 바꿉니다. (붙여넣기로 여러 항목을 채울 때)
 * 한 번에 바꿔야 되돌리기도 한 번에 취소됩니다.
 */
export function patchMany(id, values) {
  const c = cardOf(id);
  if (!c) return;
  const keys = Object.keys(values).filter(k => c[k] !== values[k]);
  if (!keys.length) return;
  const next = { ...c };
  for (const k of keys) next[k] = values[k];
  state.cards = state.cards.map(x => (x.id === id ? next : x));
  commit();   // 태그 없음 = 앞뒤 수정과 안 묶임
}

export function setMeta(key, value) {
  if (state.meta[key] === value) return;
  state.meta = { ...state.meta, [key]: value };
  commit(`meta:${key}`);
}

/* ── 문서 단위 ──────────────────────────────────────────── */
export function newDoc(cards = []) {
  state.cards = cards;
  state.selIds = cards.length ? [cards[0].id] : [];
  resetHistory();
  emit();
}

/* ── 직렬화 ─────────────────────────────────────────────── */
export function toJSON() {
  return JSON.stringify({ v: 2, meta: state.meta, cards: state.cards });
}

export function toDoc() {
  return { v: 2, meta: state.meta, cards: state.cards };
}

export function fromJSON(raw, { keepHistory = false } = {}) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || !Array.isArray(data.cards)) throw new Error('이 앱의 프로젝트 파일이 아닙니다.');
  state.meta = { series: '', steam: '', maxH: 6000, outScale: 2, format: 'webp', exportMode: 'merge', ...(data.meta || {}) };
  state.cards = data.cards.map(normalize).filter(Boolean);
  state.selIds = state.cards.length ? [state.cards[0].id] : [];
  if (!keepHistory) resetHistory();
  emit();
}
