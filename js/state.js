/**
 * 앱 상태와 변경 알림.
 * 상태를 바꾸는 모든 동작은 여기 있는 함수를 거치게 해서, 화면 갱신을 한 곳에서 처리합니다.
 */
import { createCard, normalize } from './cards/registry.js';

export const state = {
  meta: { series: '', chapter: 1, game: '', maxH: 6000 },
  cards: [],
  selId: null
};

const listeners = new Set();
/** 상태가 바뀔 때마다 부를 함수를 등록합니다. 해제 함수를 돌려줍니다. */
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() { for (const fn of listeners) fn(); }

/* ── 조회 ───────────────────────────────────────────────── */
export const selected   = () => state.cards.find(c => c.id === state.selId) || null;
export const indexOf    = id => state.cards.findIndex(c => c.id === id);

/* ── 편집 ───────────────────────────────────────────────── */
export function addCard(typeId, at = state.cards.length) {
  const card = createCard(typeId);
  state.cards.splice(Math.max(0, Math.min(at, state.cards.length)), 0, card);
  state.selId = card.id;
  emit();
  return card;
}

export function moveCard(from, to) {
  if (from === to || from < 0 || from >= state.cards.length) return;
  const [c] = state.cards.splice(from, 1);
  state.cards.splice(Math.max(0, Math.min(to, state.cards.length)), 0, c);
  emit();
}

let lastDeleted = null;
export function removeCard(id) {
  const i = indexOf(id);
  if (i < 0) return;
  lastDeleted = { card: state.cards[i], at: i };
  state.cards.splice(i, 1);
  if (state.selId === id) state.selId = state.cards[Math.min(i, state.cards.length - 1)]?.id ?? null;
  emit();
}
/** 마지막으로 지운 카드 되살리기 (Ctrl+Z) */
export function undoDelete() {
  if (!lastDeleted) return false;
  state.cards.splice(lastDeleted.at, 0, lastDeleted.card);
  state.selId = lastDeleted.card.id;
  lastDeleted = null;
  emit();
  return true;
}

export function duplicateCard(id) {
  const i = indexOf(id);
  if (i < 0) return;
  const copy = structuredClone(state.cards[i]);
  copy.id = Math.random().toString(36).slice(2, 9);
  state.cards.splice(i + 1, 0, copy);
  state.selId = copy.id;
  emit();
}

export function select(id) { state.selId = id; emit(); }

/** 선택된 카드의 속성 한 개를 바꿉니다. */
export function patch(id, key, value) {
  const c = state.cards.find(x => x.id === id);
  if (!c) return;
  c[key] = value;
  emit();
}

export function setMeta(key, value) { state.meta[key] = value; emit(); }

/* ── 회차 단위 ──────────────────────────────────────────── */
export function newChapter() {
  state.cards = [];
  state.selId = null;
  emit();
}

/** 스탯·인물 카드는 남기고 나머지를 비운 뒤 회차 번호를 올립니다. */
export function nextChapter() {
  const keep = state.cards.filter(c => c.type === 'status' || c.type === 'profile');
  state.meta.chapter = (+state.meta.chapter || 0) + 1;
  state.cards = structuredClone(keep).map(c => ({ ...c, id: Math.random().toString(36).slice(2, 9) }));
  state.selId = state.cards[0]?.id ?? null;
  emit();
}

/* ── 직렬화 ─────────────────────────────────────────────── */
export function toJSON() {
  return JSON.stringify({ v: 1, meta: state.meta, cards: state.cards });
}

export function fromJSON(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || !Array.isArray(data.cards)) throw new Error('연재 템플릿 프로젝트 파일이 아닙니다.');
  state.meta = { series: '', chapter: 1, game: '', maxH: 6000, ...(data.meta || {}) };
  state.cards = data.cards.map(normalize).filter(Boolean);
  state.selId = state.cards[0]?.id ?? null;
  emit();
}
