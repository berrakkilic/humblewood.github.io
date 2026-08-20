(function attachRouter(global) {
  function createRouter({ routes, fallback = 'map', onRoute }) {
    const routeEntries = Object.entries(routes);
    let currentRoute = null;

    function routeForPath(pathname) {
      const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
      return routeEntries.find(([, route]) => route.path === normalized)?.[0] || null;
    }

    function render(name) {
      const next = routes[name] ? name : fallback;
      currentRoute = next;
      onRoute(next, routes[next]);
      return next;
    }

    function navigate(name, { replace = false } = {}) {
      const next = routes[name] ? name : fallback;
      const target = routes[next].path;
      const method = replace ? 'replaceState' : 'pushState';
      if (global.location.pathname !== target) global.history[method]({ route: next }, '', target);
      render(next);
    }

    function start() {
      const initial = routeForPath(global.location.pathname) || fallback;
      const isCanonical = global.location.pathname === routes[initial].path;
      if (!isCanonical) global.history.replaceState({ route: initial }, '', routes[initial].path);
      render(initial);

      global.addEventListener('popstate', () => {
        render(routeForPath(global.location.pathname) || fallback);
      });

      document.addEventListener('click', event => {
        const link = event.target.closest('a[data-route]');
        if (!link || event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const name = link.dataset.route;
        if (!routes[name]) return;
        event.preventDefault();
        navigate(name);
      });
    }

    return {
      get current() { return currentRoute; },
      navigate,
      start
    };
  }

  global.HumblewoodRouter = { createRouter };
})(window);
