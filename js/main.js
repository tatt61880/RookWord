(function() {
  'use strict';
  const version = 'Version: 2022.04.23';

  window.addEventListener('load', init, false);

  function init() {
    document.getElementById('versionInfo').innerText = version;
  }
})();
