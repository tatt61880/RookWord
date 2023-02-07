(function () {
  'use strict';
  const isBrowser = typeof window !== 'undefined';

  function getQueryParams() {
    if (document.location.search === '') return null;

    const query = document.location.search.substring(1);
    const parameters = query.split('&');
    const result = new Object();

    for (let i = 0; i < parameters.length; i++) {
      const element = parameters[i].split('=');
      const paramName = decodeURIComponent(element[0]);
      const paramValue = decodeURIComponent(element[1]);

      result[paramName] = decodeURIComponent(paramValue);
    }

    return result;
  }

  if (isBrowser) {
    window.app = window.app || {};
    window.app.getQueryParams = getQueryParams;
  }
})();
