/** 자동 저장, 보관함, 프로젝트 파일 저장·불러오기. */
import { state, toJSON, toDoc, fromJSON } from '../state.js';
import { downloadText, safeName } from './files.js';
import { toast } from '../ui/toast.js';
import * as store from './store.js';

let timer = null;
let warned = false;

/**
 * 파일·보관함 이름.
 * 제목을 따로 받지 않으므로, 없으면 날짜를 붙여 서로 구분되게 합니다.
 */
const docName = () => {
  const d = new Date();
  const p = x => String(x).padStart(2, '0');
  return safeName(state.meta.series, '')
      || `리뷰_${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

/* ── 자동 저장 ──────────────────────────────────────────── */
export function autosave() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      await store.put({ id: store.CURRENT, name: docName(), doc: toDoc() });
      warned = false;
    } catch (e) {
      if (!warned) {
        warned = true;
        toast('자동 저장에 실패했습니다. 프로젝트 저장으로 파일에 보관해 주세요.', 4200);
      }
    }
  }, 700);
}

/** 앱을 켤 때 마지막 작업을 되살립니다. */
export async function restore() {
  try {
    const rec = await store.get(store.CURRENT);
    if (!rec?.doc) return false;
    fromJSON(rec.doc);
    return true;
  } catch {
    return false;
  }
}

/* ── 보관함 ─────────────────────────────────────────────── */
export const listSaved = () => store.list();

export async function saveToLibrary(name) {
  const label = (name || '').trim() || docName();
  await store.put({ id: store.newId(), name: label, doc: toDoc() });
  toast(`보관함에 "${label}" 로 담았습니다.`);
}

export async function loadFromLibrary(id) {
  const rec = await store.get(id);
  if (!rec?.doc) return toast('불러오지 못했습니다.');
  fromJSON(rec.doc);
  toast(`"${rec.name}" 을 불러왔습니다.`);
}

export async function deleteFromLibrary(id) {
  await store.remove(id);
}

/* ── 파일로 주고받기 ────────────────────────────────────── */
export function exportProject() {
  downloadText(toJSON(), `${docName()}.json`);
  toast(`${docName()}.json 저장했습니다.`);
}

export function importProject(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      fromJSON(fr.result);
      toast('프로젝트를 불러왔습니다.');
    } catch (e) {
      toast(e.message, 3600);
    }
  };
  fr.readAsText(file);
}
