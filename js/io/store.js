/**
 * 브라우저 안의 작업물 보관소 (IndexedDB).
 *
 * localStorage 는 5MB 안팎이라 스크린샷이 몇 장만 들어가도 넘칩니다.
 * IndexedDB 는 그런 제약이 사실상 없어서 자동 저장과 보관함 둘 다 여기에 둡니다.
 */

const DB = 'aar-template';
const STORE = 'docs';
const VERSION = 1;

/** 자동 저장이 쓰는 고정 칸 */
export const CURRENT = '__current';

let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    let out;
    try { out = fn(s); } catch (e) { reject(e); return; }
    t.oncomplete = () => resolve(out?.result ?? out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/** @param rec { id, name, doc } */
export function put(rec) {
  return tx('readwrite', s => s.put({ ...rec, at: Date.now() }));
}

export function get(id) {
  return tx('readonly', s => s.get(id));
}

export function remove(id) {
  return tx('readwrite', s => s.delete(id));
}

/** 보관함 목록. 자동 저장 칸은 빼고, 최근에 손댄 것부터 */
export async function list() {
  const all = await tx('readonly', s => s.getAll());
  return (all || [])
    .filter(r => r.id !== CURRENT)
    .sort((a, b) => (b.at || 0) - (a.at || 0));
}

export const newId = () => `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** IndexedDB 를 못 쓰는 환경인지 확인합니다. (사생활 보호 모드 등) */
export async function available() {
  try { await open(); return true; } catch { return false; }
}
