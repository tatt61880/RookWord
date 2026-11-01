(function () {
  'use strict';

  function getQueryParams(search = window.location.search) {
    // Decode each value once, accepting malformed escapes without crashing.
    return Object.fromEntries(new URLSearchParams(search));
  }

  function createShareUrl(base, text, options, removed) {
    const url = new URL(base);
    url.search = '';
    url.hash = '';
    url.searchParams.set('text', text);
    for (const [name, value] of Object.entries(options)) {
      url.searchParams.set(name, value ? '1' : '0');
    }
    if (removed) url.searchParams.set('removed', removed);
    return url.href;
  }

  const api = { getQueryParams, createShareUrl };
  if (typeof window !== 'undefined') {
    window.app = Object.assign(window.app || {}, api);
  }
  if (typeof module !== 'undefined') module.exports = api;
})();
