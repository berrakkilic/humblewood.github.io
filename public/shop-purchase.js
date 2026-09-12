(() => {
  'use strict';

  const shopId = document.body.dataset.shopId;
  if (!shopId || window.parent === window) return;

  function slug(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const products = [];
  let stock = {};

  document.querySelectorAll('.item').forEach(item => {
    const heading = item.querySelector('h3');
    const price = item.querySelector('.price');
    if (!heading || !price || /display only/i.test(price.textContent)) return;

    const product = {
      item,
      itemId: `${shopId}:${slug(heading.textContent)}`,
      itemName: heading.textContent.trim(),
      priceLabel: price.textContent.trim(),
      pendingRequestId: '',
      originalStockLabels: [...item.querySelectorAll('.stock')]
    };

    const row = document.createElement('div');
    row.className = 'purchase-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'purchase-btn';
    button.textContent = 'Purchase';
    button.setAttribute('aria-label', `Purchase ${product.itemName} for ${product.priceLabel}`);
    const stockLabel = document.createElement('span');
    stockLabel.className = 'purchase-stock';
    stockLabel.setAttribute('aria-live', 'polite');
    const message = document.createElement('span');
    message.className = 'purchase-message';
    message.setAttribute('aria-live', 'polite');
    row.append(button, stockLabel, message);
    item.appendChild(row);

    Object.assign(product, { button, row, stockLabel, message });
    products.push(product);

    button.addEventListener('click', () => {
      if (button.disabled || product.pendingRequestId) return;
      product.pendingRequestId = globalThis.crypto?.randomUUID?.()
        || `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      button.disabled = true;
      button.textContent = 'Waiting…';
      message.textContent = '';
      message.className = 'purchase-message';
      window.parent.postMessage({
        type: 'humblewood:shop-purchase-request',
        requestId: product.pendingRequestId,
        itemId: product.itemId,
        itemName: product.itemName,
        priceLabel: product.priceLabel
      }, '*');
    });
  });

  function hasFiniteStock(product) {
    return Object.prototype.hasOwnProperty.call(stock, product.itemId);
  }

  function renderProduct(product) {
    const finite = hasFiniteStock(product);
    const remaining = finite ? Math.max(0, Number(stock[product.itemId]) || 0) : null;
    product.row.classList.toggle('has-stock', finite);
    product.originalStockLabels.forEach(label => { label.hidden = true; });
    product.stockLabel.textContent = finite
      ? `${remaining} ${remaining === 1 ? 'item' : 'items'} in stock`
      : '';
    product.button.disabled = !!product.pendingRequestId || (finite && remaining < 1);
    product.button.textContent = finite && remaining < 1
      ? 'Sold out'
      : product.pendingRequestId ? 'Waiting…' : 'Purchase';
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || !event.data || typeof event.data !== 'object') return;
    const message = event.data;
    if (message.type === 'humblewood:shop-context') {
      stock = message.stock && typeof message.stock === 'object' ? message.stock : {};
      document.body.classList.add('shop-connected');
      document.body.classList.toggle('player-shop', message.role === 'player');
      products.forEach(renderProduct);
      return;
    }
    if (message.type !== 'humblewood:shop-purchase-result') return;
    const product = products.find(entry => (
      entry.itemId === message.itemId &&
      (!entry.pendingRequestId || !message.requestId || entry.pendingRequestId === message.requestId)
    ));
    if (!product) return;
    product.pendingRequestId = '';
    if (Number.isInteger(message.stock)) stock[product.itemId] = message.stock;
    product.message.textContent = message.message || (message.ok ? 'Purchased.' : 'Purchase failed.');
    product.message.className = `purchase-message ${message.ok ? 'purchase-success' : 'purchase-error'}`;
    renderProduct(product);
  });

  window.parent.postMessage({ type: 'humblewood:shop-ready' }, '*');
})();
