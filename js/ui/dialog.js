/**
 * 대화상자 공용 껍데기.
 * 내용만 넘기면 배경 덮기·Esc 닫기·버튼 줄을 알아서 붙여 줍니다.
 */

let wrap = null;
let current = null;

function ensure() {
  if (wrap) return wrap;
  wrap = document.createElement('div');
  wrap.className = 'dlg-wrap';
  wrap.hidden = true;
  wrap.innerHTML = `<div class="dlg-back"></div><div class="dlg" role="dialog" aria-modal="true"></div>`;
  wrap.querySelector('.dlg-back').addEventListener('click', () => closeDialog());
  document.body.appendChild(wrap);

  document.addEventListener('keydown', e => {
    if (wrap.hidden) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeDialog(); }
    if (e.key === 'Enter' && !/^(TEXTAREA)$/.test(document.activeElement?.tagName)) {
      const ok = wrap.querySelector('[data-role="ok"]');
      if (ok) { e.preventDefault(); ok.click(); }
    }
  }, true);
  return wrap;
}

/**
 * @param opt.title  제목
 * @param opt.html   본문 HTML
 * @param opt.ok     확인 버튼 라벨. 없으면 확인 버튼을 안 답니다
 * @param opt.onOk   확인을 눌렀을 때. false 를 돌려주면 닫지 않습니다
 * @param opt.onMount(dlg) 본문이 붙은 뒤 이벤트를 걸 자리
 * @param opt.wide   넓은 상자
 */
export function showDialog(opt) {
  ensure();
  current = opt;
  const dlg = wrap.querySelector('.dlg');
  dlg.classList.toggle('wide', !!opt.wide);
  dlg.innerHTML = `
    <h2></h2>
    <div class="dlg-body"></div>
    <div class="dlg-foot">
      <button type="button" class="ghost" data-role="cancel">${opt.cancel || '닫기'}</button>
      ${opt.ok ? `<button type="button" class="primary" data-role="ok">${opt.ok}</button>` : ''}
    </div>`;
  dlg.querySelector('h2').textContent = opt.title || '';
  dlg.querySelector('.dlg-body').innerHTML = opt.html || '';
  dlg.querySelector('[data-role="cancel"]').addEventListener('click', () => closeDialog());
  dlg.querySelector('[data-role="ok"]')?.addEventListener('click', async () => {
    if (await opt.onOk?.(dlg) === false) return;
    closeDialog();
  });

  wrap.hidden = false;
  opt.onMount?.(dlg);
  (dlg.querySelector('[autofocus]') || dlg.querySelector('[data-role="ok"]') || dlg).focus?.();
  return dlg;
}

export function closeDialog() {
  if (!wrap || wrap.hidden) return;
  wrap.hidden = true;
  const done = current?.onClose;
  current = null;
  done?.();
}

export const isDialogOpen = () => !!wrap && !wrap.hidden;
