/** Reusable native dialog and popover controllers with accessible fallbacks. */

interface DialogControllerOptions {
  onDismiss?: (reason: string, returnValue: string) => void;
  onOpen?: () => void;
  restoreFocus?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

interface PopoverControllerOptions {
  mode?: 'auto' | 'manual';
  closeOnOutsideClick?: boolean;
}

interface DialogController {
  element: HTMLDialogElement;
  open: () => void;
  close: (reason?: string) => void;
  isOpen: () => boolean;
}

interface PopoverController {
  element: HTMLElement;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

function createDialogController(dialog: HTMLDialogElement, options: DialogControllerOptions = {}): DialogController {
  if (!dialog) throw new Error('A dialog element is required.');
  let lastFocused: HTMLElement | null = null;
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
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.classList.remove('hidden');
    dialog.setAttribute('aria-hidden', 'false');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      fallbackOpen = true;
      dialog.setAttribute('open', '');
    }
    queueMicrotask(() => {
      const firstFocusable = dialog.querySelector(
        '[autofocus], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable instanceof HTMLElement) firstFocusable.focus({ preventScroll: true });
    });
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
    const closeButton = event.target instanceof Element ? event.target.closest('[data-dialog-close]') : null;
    if (closeButton instanceof HTMLElement && dialog.contains(closeButton)) {
      close(closeButton.dataset.dialogClose || 'close');
      return;
    }
    if (options.closeOnBackdrop !== false && event.target === dialog) close('backdrop');
  });
  dialog.addEventListener('cancel', event => {
    if (options.closeOnEscape === false) event.preventDefault();
    else dialog.returnValue = 'escape';
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !fallbackOpen) return;
    const focusable = (Array.from(dialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[]).filter(element => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('close', () => finalizeClose(dialog.returnValue || 'dismiss'));

  return {
    element: dialog,
    open,
    close,
    isOpen: () => !!dialog.open || fallbackOpen
  };
}

function createPopoverController(popover: HTMLElement, options: PopoverControllerOptions = {}): PopoverController {
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
    if (event.target instanceof Element && event.target.closest('[data-popover-close]')) hide();
  });
  if (!nativePopover) {
    popover.hidden = true;
    popover.setAttribute('aria-hidden', 'true');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popover.hidden) hide();
    });
    if (options.closeOnOutsideClick !== false) {
      document.addEventListener('click', event => {
        if (!suppressOutsideClick && !popover.hidden && event.target instanceof Node && !popover.contains(event.target)) hide();
      });
    }
  }

  return { element: popover, show, hide, toggle, isOpen: () => nativePopover ? popover.matches(':popover-open') : !popover.hidden };
}

window.HumblewoodOverlays = {
  createDialogController,
  createPopoverController
};
