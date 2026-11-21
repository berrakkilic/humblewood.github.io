/** Shared formatting, escaping, toast, and upload helpers. */

// ================= Shared helpers =================
function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function initializeSmoothDetails(duration = 360) {
  document.querySelectorAll('details').forEach((detailsElement) => {
    const details = detailsElement as HTMLDetailsElement;
    const summary = details.querySelector(':scope > summary') as HTMLElement | null;
    if (!summary || details.dataset.smoothDetailsInitialized === 'true') return;
    details.dataset.smoothDetailsInitialized = 'true';
    details.style.overflow = 'hidden';

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (details.dataset.smoothAnimating === 'true') return;

      const summaryHeight = summary.getBoundingClientRect().height +
        parseFloat(getComputedStyle(details).paddingTop || '0') +
        parseFloat(getComputedStyle(details).paddingBottom || '0');

      if (details.open) {
        details.dataset.smoothAnimating = 'true';
        details.style.height = `${details.getBoundingClientRect().height}px`;
        details.style.transition = `height ${duration}ms cubic-bezier(.22, 1, .36, 1)`;
        requestAnimationFrame(() => {
          details.style.height = `${summaryHeight}px`;
        });
        window.setTimeout(() => {
          details.open = false;
          details.style.height = '';
          details.style.transition = '';
          details.dataset.smoothAnimating = 'false';
        }, duration);
      } else {
        details.open = true;
        details.dataset.smoothAnimating = 'true';
        const targetHeight = details.getBoundingClientRect().height;
        details.style.height = `${summaryHeight}px`;
        details.style.transition = `height ${duration}ms cubic-bezier(.22, 1, .36, 1)`;
        requestAnimationFrame(() => {
          details.style.height = `${targetHeight}px`;
        });
        window.setTimeout(() => {
          details.style.height = '';
          details.style.transition = '';
          details.dataset.smoothAnimating = 'false';
        }, duration);
      }
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function getElementById<K extends string>(id: K): FrontendElementForId<K> | null {
  return document.getElementById(id) as FrontendElementForId<K> | null;
}

function getElementByIdAs<T extends Element>(id: string): T | null {
  return document.getElementById(id) as unknown as T | null;
}

function getRequiredElement<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

function getOptionalElement<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function getRequiredButton(id: string): HTMLButtonElement {
  return getRequiredElement<HTMLButtonElement>(`#${CSS.escape(id)}`);
}

function getRequiredInput(id: string): HTMLInputElement {
  return getRequiredElement<HTMLInputElement>(`#${CSS.escape(id)}`);
}

function getRequiredSelect(id: string): HTMLSelectElement {
  return getRequiredElement<HTMLSelectElement>(`#${CSS.escape(id)}`);
}

function safeAssetUrl(value, prefixes = ['uploads', 'images']) {
  const url = String(value ?? '').trim();
  const prefixPattern = prefixes.map(prefix => String(prefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`^/(?:${prefixPattern})/[A-Za-z0-9._~%()+-]+$`).test(url) ? url : '';
}

function safeImageUrl(value) {
  const url = String(value ?? '').trim();
  if (/^data:image\/(?:gif|jpe?g|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(url)) return url;
  return safeAssetUrl(url, ['uploads', 'images']);
}

function applyPresetSearch(selectId: string, searchId: string) {
  const select = getElementById(selectId) as HTMLSelectElement;
  const search = getElementById(searchId) as HTMLInputElement;
  if (!select || !search) return;

  select.classList.add('hidden');
  select.setAttribute('tabindex', '-1');
  const combobox = search.closest('.preset-combobox') as HTMLElement | null;
  if (!combobox) return;
  if (combobox.dataset.presetSearchInitialized === 'true') return;
  combobox.dataset.presetSearchInitialized = 'true';
  let list = combobox.querySelector('.preset-combobox-list') as HTMLElement | null;
  if (!list) {
    list = document.createElement('div');
    list.className = 'preset-combobox-list hidden';
    list.setAttribute('role', 'listbox');
    combobox.appendChild(list);
  }

  const openList = () => {
    renderList();
    list.classList.remove('hidden');
    search.setAttribute('aria-expanded', 'true');
  };
  const closeList = () => {
    list.classList.add('hidden');
    search.setAttribute('aria-expanded', 'false');
  };
  const renderList = () => {
    const query = search.value.trim().toLowerCase();
    list.innerHTML = '';
    let matches = 0;
    (Array.from(select.querySelectorAll(':scope > optgroup')) as HTMLOptGroupElement[]).forEach(group => {
      const filtered = (Array.from(group.querySelectorAll(':scope > option')) as HTMLOptionElement[]).filter(option => {
        const text = `${option.textContent || ''} ${group.getAttribute('label') || ''}`.toLowerCase();
        return !query || text.includes(query);
      });
      if (!filtered.length) return;
      matches += filtered.length;
      const heading = document.createElement('div');
      heading.className = 'preset-combobox-group';
      heading.textContent = group.getAttribute('label') || '';
      list.appendChild(heading);
      filtered.forEach(option => appendOption(option));
    });
    (Array.from(select.options) as HTMLOptionElement[]).filter(option =>
      !option.parentElement?.matches('optgroup') &&
      !!option.value &&
      (!query || `${option.textContent || ''}`.toLowerCase().includes(query))
    ).forEach(option => appendOption(option));
    if (!matches && !list.children.length) {
      list.innerHTML = '<div class="preset-combobox-group">No matching presets</div>';
    }
  };

  const appendOption = (option: HTMLOptionElement) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-combobox-option';
    button.setAttribute('role', 'option');
    button.textContent = option.textContent || '';
    button.onmousedown = event => event.preventDefault();
    button.onclick = () => {
      select.value = option.value;
      search.value = option.textContent || '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closeList();
    };
    list.appendChild(button);
  };

  search.onfocus = openList;
  search.onclick = openList;
  search.oninput = openList;
  combobox.onkeydown = event => {
    if (event.key === 'Escape') closeList();
  };
  document.addEventListener('mousedown', event => {
    if (!combobox.contains(event.target as Node)) closeList();
  });
  const observer = new MutationObserver(() => {
    if (!list.classList.contains('hidden')) renderList();
  });
  observer.observe(select, { childList: true, subtree: true });
  renderList();
}

function showToast(message) {
  const toast = getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

async function uploadAudioFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/audio', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'The MP3 could not be uploaded.');
  return data;
}

async function uploadLibraryFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/library', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'The file could not be uploaded.');
  return data;
}
