(function() {
  'use strict';
  const version = 'Version: 2022.04.23';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  window.addEventListener('load', init, false);

  const blockSize = 40;

  const table = [
    'あいうえお　',
    'かきくけこ　',
    'さしすせそ　',
    'たちつてと　',
    'なにぬねの　',
    'はひふへほ　',
    'まみむめも　',
    'や　ゆ　よ　',
    'らりるれろ　',
    'わ　　　を　',
    'ん　　　　×',
  ];

  const charPos = {};

  let elemSvg;
  let elemText;

  function createRect(param) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', param.x);
    rect.setAttribute('y', param.y);
    rect.setAttribute('width', param.width);
    rect.setAttribute('height', param.height);
    return rect;
  }

  function createCircle(param) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', param.cx);
    circle.setAttribute('cy', param.cy);
    circle.setAttribute('r', param.r);
    return circle;
  }

  function createLine(param) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', param.x1);
    line.setAttribute('y1', param.y1);
    line.setAttribute('x2', param.x2);
    line.setAttribute('y2', param.y2);
    return line;
  }

  function createText(param) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', param.x);
    text.setAttribute('y', param.y);
    text.textContent = param.text;
    return text;
  }

  function updateResult() {
    // 過去の結果を削除
    const elemResult = document.getElementById('result');
    if (elemResult !== null) elemResult.remove();

    // 現在の結果を追加
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', 'result');
    const text = elemText.value;
    if (text.length != 0) {
      let pos = charPos[text[0]];
      if (pos === undefined) pos = charPos['×'];

      const circle = createCircle({cx: pos.x, cy: pos.y, r: 4});
      circle.setAttribute('fill', 'red');
      circle.setAttribute('stroke', 'none');
      g.appendChild(circle);
    }
    for (let i = 1; i < text.length; ++i) {
      let pos1 = charPos[text[i - 1]];
      let pos2 = charPos[text[i]];
      if (pos1 === undefined) pos1 = charPos['×'];
      if (pos2 === undefined) pos2 = charPos['×'];

      const circle = createCircle({cx: pos2.x, cy: pos2.y, r: 3});
      circle.setAttribute('fill', 'red');
      circle.setAttribute('stroke', 'none');
      g.appendChild(circle);

      const line = createLine({x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y});
      line.setAttribute('stroke', 'red');
      line.setAttribute('stroke-width', '1');
      g.appendChild(line);
    }
    elemSvg.appendChild(g);
  }

  function init() {
    document.getElementById('versionInfo').innerText = version;

    elemSvg = document.getElementById('svgMain');
    elemText = document.getElementById('inputText');
    elemText.addEventListener('change', updateResult, false);
    document.addEventListener('keyup', updateResult, false);
    document.addEventListener('mouseup', updateResult, false);

    const g = document.createElementNS(SVG_NS, 'g');
    for (let col = 0; col < table.length; ++col) {
      for (let row = 0; row < 6; ++row) {
        const char = table[col][row];
        if (char == '　') continue;
        const x = 430 - col * 40;
        const y = 30 + row * 40;
        charPos[char] = {x: x + blockSize / 2, y: y + blockSize / 2};

        const rect = createRect({x: x, y: y, width: blockSize, height: blockSize});
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
