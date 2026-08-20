const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const windowListeners = {};
const documentListeners = {};
const window = {
  location: { pathname: '/characters' },
  history: {
    pushState(state, title, url) { window.location.pathname = url; },
    replaceState(state, title, url) { window.location.pathname = url; }
  },
  addEventListener(event, listener) { windowListeners[event] = listener; }
};
const document = {
  addEventListener(event, listener) { documentListeners[event] = listener; }
};

const routerSource = fs.readFileSync(path.resolve(__dirname, '../public/js/router.js'), 'utf8');
vm.runInNewContext(routerSource, { window, document });

const visited = [];
const router = window.HumblewoodRouter.createRouter({
  routes: {
    map: { path: '/map' },
    characters: { path: '/characters' },
    dice: { path: '/dice' }
  },
  fallback: 'map',
  onRoute: route => visited.push(route)
});

router.start();
assert.equal(router.current, 'characters');
assert.equal(visited.at(-1), 'characters');

router.navigate('dice');
assert.equal(window.location.pathname, '/dice');
assert.equal(router.current, 'dice');

window.location.pathname = '/map';
windowListeners.popstate();
assert.equal(router.current, 'map');

console.log('Router checks passed: deep links, navigation, and history events.');
