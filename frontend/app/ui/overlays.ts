/** Reusable native dialog and popover controllers with accessible fallbacks. */

function createDialogController(dialog: any, options: any = {}) {
  if (!dialog) throw new Error('A dialog element is required.');
  let lastFocused: any = null;
  let fallbackOpen = false;

  function finalizeClose(reason = 'dismiss') {
    fallbackOpen = false;
    dialog.classList.add('hidden');
    dialog.setAttribute('aria-hidden', 'true');
    if (typeof options.onDismiss === 'function') options.onDismiss(reason, dialog.returnValue || '');
    if (options.restoreFocus !== false && lastFocused?.focus) {
      try { lastFocused.focus({ preventScroll: true }); } catch { lastFocused.focus(); }
    }
  }

  function open() {
    if (dialog.open || fallbackOpen) return;
    lastFocused = document.activeElement;
    dialog.classList.remove('hidden');
    dialog.setAttribute('aria-hidden', 'false');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      fallbackOpen = true;
      dialog.setAttribute('open', '');
    }
    if (typeof options.onOpen === 'function') options.onOpen();
  }

  function close(reason = 'dismiss') {
    dialog.returnValue = reason;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close(reason);
    else if (fallbackOpen || dialog.hasAttribute('open')) {
      dialog.removeAttribute('open');
      finalizeClose(reason);
    }
  }

  dialog.addEventListener('click', event => {
    const closeButton = event.target?.closest?.('[data-dialog-close]');
    if (closeButton && dialog.contains(closeButton)) {
      close(closeButton.dataset.dialogClose || 'close');
      return;
    }
    if (options.closeOnBackdrop !== false && event.target === dialog) close('backdrop');
  });
  dialog.addEventListener('cancel', event => {
    if (options.closeOnEscape === false) event.preventDefault();
    else dialog.returnValue = 'escape';
  });
  dialog.addEventListener('close', () => finalizeClose(dialog.returnValue || 'dismiss'));

  return {
    element: dialog,
    open,
    close,
    isOpen: () => !!dialog.open || fallbackOpen
  };
}

function createPopoverController(popover: any, options: any = {}) {
  if (!popover) throw new Error('A popover element is required.');
  const nativePopover = typeof popover.showPopover === 'function';
  let suppressOutsideClick = false;
  if (nativePopover && !popover.hasAttribute('popover')) popover.setAttribute('popover', options.mode || 'auto');

  function show() {
    if (nativePopover) {
      if (!popover.matches(':popover-open')) popover.showPopover();
    } else {
      suppressOutsideClick = true;
      popover.hidden = false;
      popover.setAttribute('aria-hidden', 'false');
      popover.classList.add('popover-fallback-open');
      queueMicrotask(() => { suppressOutsideClick = false; });
    }
  }

  function hide() {
    if (nativePopover) {
      if (popover.matches(':popover-open')) popover.hidePopover();
    } else {
      popover.hidden = true;
      popover.setAttribute('aria-hidden', 'true');
      popover.classList.remove('popover-fallback-open');
    }
  }

  function toggle() {
    if (nativePopover) popover.togglePopover();
    else if (popover.hidden) show(); else hide();
  }

  popover.addEventListener('click', event => {
    if (event.target?.closest?.('[data-popover-close]')) hide();
  });
  if (!nativePopover) {
    popover.hidden = true;
    popover.setAttribute('aria-hidden', 'true');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popover.hidden) hide();
    });
    if (options.closeOnOutsideClick !== false) {
      document.addEventListener('click', event => {
        if (!suppressOutsideClick && !popover.hidden && !popover.contains(event.target)) hide();
      });
    }
  }

  return { element: popover, show, hide, toggle, isOpen: () => nativePopover ? popover.matches(':popover-open') : !popover.hidden };
}

(window as any).HumblewoodOverlays = {
  createDialogController,
  createPopoverController
};
