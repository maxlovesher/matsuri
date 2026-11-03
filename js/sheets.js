/* Thin wrapper over native <dialog>: it already gives focus trapping, Esc and
   focus restore, so this only adds the slide-out and backdrop-click to close. */
const Sheets = (() => {
  const CLOSE_MS = 280;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const open = new Set();
  const listeners = new Set();

  const notify = () => listeners.forEach((listener) => listener());

  const show = (dialog) => {
    if (dialog.open) return;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    open.add(dialog);
    notify();
  };

  const hide = (dialog) => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
      open.delete(dialog);
      notify();
      dialog.dispatchEvent(new CustomEvent('sheetclosed'));
    }, reducedMotion ? 0 : CLOSE_MS);
  };

  const register = (dialog) => {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      hide(dialog);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) hide(dialog);
      if (event.target.closest('[data-sheet-close]')) hide(dialog);
    });
  };

  return {
    register,
    show,
    hide,
    active: () => [...open].pop() || null,
    onChange: (listener) => listeners.add(listener),
  };
})();
