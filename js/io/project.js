/** 자동 저장(브라우저)과 프로젝트 파일 저장·불러오기. */
import { state, toJSON, fromJSON } from '../state.js';
import { downloadText, safeName } from './files.js';
import { toast } from '../ui/toast.js';

const KEY = 'aar-template/v1';
let timer = null;
let warned = false;

/** 변경 후 잠시 뒤 브라우저에 저장합니다. */
export function autosave() {
  clearTimeout(timer);
  timer = setTimeout(save, 700);
}

function save() {
  try {
    localStorage.setItem(KEY, toJSON());
    warned = false;
  } catch {
    // 이미지가 많으면 용량을 넘길 수 있습니다. 이미지를 뺀 뼈대만 남깁니다.
    try {
      const light = JSON.parse(toJSON());
      light.cards = light.cards.map(c => {
        const o = { ...c };
        for (const k of Object.keys(o)) if (typeof o[k] === 'string' && o[k].startsWith('data:image')) o[k] = null;
        return o;
      });
      light.stripped = true;
      localStorage.setItem(KEY, JSON.stringify(light));
      if (!warned) {
        warned = true;
        toast('이미지가 많아 자동 저장에는 글만 담겼습니다. 프로젝트 저장으로 파일에 보관하세요.', 4200);
      }
    } catch { /* 자동 저장 포기 */ }
  }
}

/** 앱을 켤 때 마지막 작업을 되살립니다. */
export function restore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    fromJSON(raw);
    return true;
  } catch {
    return false;
  }
}

export function clearSaved() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

export function exportProject() {
  const name = `${safeName(state.meta.series, '연재')}_${state.meta.chapter}화.json`;
  downloadText(toJSON(), name);
  toast(`${name} 저장했습니다.`);
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
