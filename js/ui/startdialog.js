/** 새로 시작할 때 뜨는 틀 고르기. */
import { TEMPLATES, templateById } from '../templates.js';
import { createCard } from '../cards/registry.js';
import { newDoc } from '../state.js';
import { showDialog } from './dialog.js';

export function openStartDialog(onDone) {
  let picked = TEMPLATES[0].id;

  showDialog({
    title: '무엇부터 시작할까요',
    ok: '시작하기',
    cancel: '취소',
    html: `<div class="picks">
      ${TEMPLATES.map(t => `
        <button type="button" class="pick" data-id="${t.id}">
          <b></b><em class="beta" hidden>실험적</em><span></span><i></i>
        </button>`).join('')}
    </div>`,

    onMount(dlg) {
      dlg.querySelectorAll('.pick').forEach(btn => {
        const t = templateById(btn.dataset.id);
        btn.querySelector('b').textContent = t.name;
        btn.querySelector('span').textContent = t.desc;
        btn.querySelector('i').textContent = t.cards.length ? `${t.cards.length}장` : '';
        btn.querySelector('.beta').hidden = !t.beta;
        btn.classList.toggle('on', t.id === picked);
        btn.addEventListener('click', () => {
          picked = t.id;
          dlg.querySelectorAll('.pick').forEach(b => b.classList.toggle('on', b === btn));
        });
        btn.addEventListener('dblclick', () => dlg.querySelector('[data-role="ok"]').click());
      });
    },

    onOk() {
      newDoc(templateById(picked).cards.map(createCard));
      onDone?.();
    }
  });
}
