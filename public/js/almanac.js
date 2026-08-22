(function attachAlmanac(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HumblewoodAlmanac = api;
})(typeof window !== 'undefined' ? window : null, function createAlmanac() {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
  }

  function normalizeSearch(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function searchableText(category, entry) {
    return normalizeSearch(JSON.stringify({
      category: category.title,
      entry
    }));
  }

  function filterCategories(categories, query) {
    const tokens = normalizeSearch(query).split(' ').filter(Boolean);
    if (!tokens.length) return categories.map(category => ({ ...category, entries: [...category.entries] }));
    return categories.map(category => ({
      ...category,
      entries: category.entries.filter(entry => {
        const haystack = searchableText(category, entry);
        return tokens.every(token => haystack.includes(token));
      })
    })).filter(category => category.entries.length);
  }

  function renderFacts(facts = []) {
    if (!facts.length) return '';
    return `<dl class="almanac-facts">${facts.map(([label, value]) => `
      <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>
    `).join('')}</dl>`;
  }

  function renderSections(sections = []) {
    return sections.map(section => `
      <section class="almanac-entry-section">
        <h4>${escapeHtml(section.heading)}</h4>
        ${section.text ? `<p>${escapeHtml(section.text)}</p>` : ''}
        ${section.items?.length ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      </section>
    `).join('');
  }

  function renderImage(image) {
    if (!image?.src) return '';
    const caption = image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : '';
    return `
      <figure class="almanac-entry-image">
        <a href="${escapeHtml(image.src)}" target="_blank" rel="noopener" title="Open full-size image">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || '')}" loading="lazy">
        </a>
        ${caption}
      </figure>
    `;
  }

  function renderEntry(entry, queryActive) {
    return `
      <details class="almanac-entry${entry.wide ? ' almanac-entry-wide' : ''}" data-almanac-entry ${queryActive || entry.openByDefault ? 'open' : ''}>
        <summary>
          <span class="almanac-entry-heading">
            <strong>${escapeHtml(entry.title)}</strong>
            <span>${escapeHtml(entry.kicker || '')}</span>
          </span>
          <span class="almanac-entry-toggle" aria-hidden="true"></span>
        </summary>
        <div class="almanac-entry-body">
          <p class="almanac-entry-summary">${escapeHtml(entry.summary)}</p>
          ${renderImage(entry.image)}
          ${renderFacts(entry.facts)}
          ${renderSections(entry.sections)}
        </div>
      </details>
    `;
  }

  function renderCategory(category, { open, queryActive }) {
    return `
      <details class="almanac-category" data-almanac-category="${escapeHtml(category.id)}" ${open ? 'open' : ''}>
        <summary>
          <span class="almanac-category-icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
          <span class="almanac-category-copy">
            <strong>${escapeHtml(category.title)}</strong>
            <span>${escapeHtml(category.description)}</span>
          </span>
          <span class="almanac-category-count">${category.entries.length}</span>
          <span class="almanac-category-toggle" aria-hidden="true"></span>
        </summary>
        <div class="almanac-entry-list">
          ${category.entries.map(entry => renderEntry(entry, queryActive)).join('')}
        </div>
      </details>
    `;
  }

  function mount(categories, documentRoot = document) {
    const search = documentRoot.getElementById('almanac-search');
    const clear = documentRoot.getElementById('almanac-search-clear');
    const openAll = documentRoot.getElementById('almanac-open-all');
    const closeAll = documentRoot.getElementById('almanac-close-all');
    const results = documentRoot.getElementById('almanac-results');
    const container = documentRoot.getElementById('almanac-categories');
    const empty = documentRoot.getElementById('almanac-empty');
    if (!search || !clear || !openAll || !closeAll || !results || !container || !empty) return null;

    const totalEntries = categories.reduce((sum, category) => sum + category.entries.length, 0);
    let firstRender = true;

    function render() {
      const query = search.value.trim();
      const queryActive = !!normalizeSearch(query);
      const previouslyOpen = new Set(Array.from(container.querySelectorAll('[data-almanac-category][open]')).map(element => element.dataset.almanacCategory));
      const filtered = filterCategories(categories, query);
      const visibleEntries = filtered.reduce((sum, category) => sum + category.entries.length, 0);

      container.innerHTML = filtered.map((category, index) => renderCategory(category, {
        open: queryActive || previouslyOpen.has(category.id) || (firstRender && index === 0),
        queryActive
      })).join('');
      firstRender = false;

      clear.classList.toggle('hidden', !query);
      empty.classList.toggle('hidden', visibleEntries !== 0);
      if (queryActive) {
        results.textContent = `${visibleEntries} ${visibleEntries === 1 ? 'leaf' : 'leaves'} found for “${query}”`;
      } else {
        results.textContent = `${totalEntries} entries gathered in the almanac`;
      }
    }

    search.addEventListener('input', render);
    search.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !search.value) return;
      search.value = '';
      render();
    });
    clear.addEventListener('click', () => {
      search.value = '';
      render();
      search.focus();
    });
    openAll.addEventListener('click', () => {
      container.querySelectorAll('details').forEach(details => { details.open = true; });
    });
    closeAll.addEventListener('click', () => {
      container.querySelectorAll('details').forEach(details => { details.open = false; });
    });

    render();
    return { render };
  }

  return { filterCategories, mount, normalizeSearch, renderEntry, searchableText };
});
