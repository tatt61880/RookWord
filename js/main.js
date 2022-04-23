(function() {
  'use strict';
  const version = 'Version: 2022.04.23';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  window.addEventListener('load', init, false);

  const table = [
    'あいうえお',
    'かきくけこ',
    'さしすせそ',
    'たちつてと',
    'なにぬねの',
    'はひふへほ',
    'まみむめも',
    'や　ゆ　よ',
    'らりるれろ',
    'わ　　　を',
    'ん　　　　',
  ];

  function createRect(param) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', param.x);
    rect.setAttribute('y', param.y);
    rect.setAttribute('width', param.width);
    rect.setAttribute('height', param.height);
    return rect;
  }

  function createText(param) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', param.x);
    text.setAttribute('y', param.y);
    text.textContent = param.text;
    return text;
  }

  function init() {
    document.getElementById('versionInfo').innerText = version;

    const elemSvg = document.getElementById('svgMain');
    const g = document.createElementNS(SVG_NS, 'g');
    const blockSize = 40;
    for (let col = 0; col < table.length; ++col) {
      for (let row = 0; row < 5; ++row) {
        const char = table[col][row];
        if (char == '　') continue;
        const rect = createRect({x: 430 - col * 40, y: 30 + row * 40, width: blockSize, height: blockSize});
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', 'black');
        rect.setAttribute('stroke-width', '2');
        g.appendChild(rect);
        const text = createText({x: 438 - col * blockSize, y: 60 + row * blockSize, text: char});
        text.setAttribute('font-size', '24px');
        g.appendChild(text);
      }
    }
    elemSvg.appendChild(g);
  }
})();
