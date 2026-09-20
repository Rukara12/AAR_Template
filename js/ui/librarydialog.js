/** 보관함 — 브라우저에 담아 둔 작업물 목록. */
import { state } from '../state.js';
import { listSaved, saveToLibrary, loadFromLibrary, deleteFromLibrary } from '../io/project.js';
import { showDialog, closeDialog } from './dialog.js';
import { toast } from './toast.js';

const fmt = ts => {
  const d = new Date(ts || Date.now());
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function openLibraryDialog() {
  showDialog({
    title: '보관함',
    wide: true,
    cancel: '닫기',
    html: `
      <div class="lib-save">
        <input id="libName" placeholder="지금 작업을 담을 이름" autofocus>
        <button type="button" class="primary" id="libAdd">담기</button>
      </div>
      <div class="lib-list" id="libList"><p class="hint">불러오는 중…</p></div>
      <p class="hint">브라우저 안에만 저장됩니다. 컴퓨터를 바꾸거나 방문 기록을 지우면 사라지니,
      오래 남길 것은 <b>문서 ▾ → 프로젝트 저장</b> 으로 파일에 따로 보관하세요.</p>`,

    onMount(dlg) {
      const listEl = dlg.querySelector('#libList');
      const nameEl = dlg.querySelector('#libName');

      const refresh = async () => {
        let items = [];
        try { items = await listSaved(); } catch { /* 못 읽으면 빈 목록 */ }

        if (!items.length) {
          listEl.innerHTML = `<p class="hint">아직 담아 둔 작업이 없습니다.</p>`;
          return;
        }

        listEl.innerHTML = '';
        for (const it of items) {
          const row = document.createElement('div');
          row.className = 'lib-row';
          row.innerHTML = `
            <span class="lib-main"><b></b><span></span></span>
            <button type="button" class="ghost" data-act="load">불러오기</button>
            <button type="button" class="mini" data-act="del" title="지우기">✕</button>`;
          row.querySelector('b').textContent = it.name || '이름 없음';
          row.querySelector('.lib-main span').textContent =
            `${fmt(it.at)} · 카드 ${it.doc?.cards?.length ?? 0}장`;

          row.querySelector('[data-act="load"]').addEventListener('click', async () => {
            if (state.cards.length && !confirm('지금 작업을 덮어씁니다. 계속할까요?')) return;
            await loadFromLibrary(it.id);
            closeDialog();
          });
          row.querySelector('[data-act="del"]').addEventListener('click', async () => {
            if (!confirm(`"${it.name}" 을 지웁니다. 계속할까요?`)) return;
            await deleteFromLibrary(it.id);
            refresh();
          });
          listEl.appendChild(row);
        }
      };

      dlg.querySelector('#libAdd').addEventListener('click', async () => {
        try {
          await saveToLibrary(nameEl.value);
          refresh();
        } catch {
          toast('담지 못했습니다. 브라우저 설정을 확인해 주세요.');
        }
      });

      refresh();
    }
  });
}
