let el = null;
let timer = null;

export function toast(msg, ms = 2200) {
  el = el || document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('on'), ms);
}
