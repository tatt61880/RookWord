(function() {
  'use strict';
  const version = 'Version: 2022.04.23-f';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  window.addEventListener('load', init, false);

  const blockSize = 40;
  const sizePoint = 3;
  const sizeFirstPoint = 5;
  const charOther = '他';

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
    'ん　　　　' + charOther,
  ];

  const charPos = {};

  let elemSvg;
  let elemText;
  let elemCheckboxKatakana;
  let elemCheckboxSmall;
  let elemCheckboxDakuten;

  let optionKatakana;
  let optionSmall;
  let optionDakuten;

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

  function katakanaToHiragana(char) {
    const code = char.charCodeAt(0);
    if (12448 < code) {
      return String.fromCharCode(code - 0x60);
    }
    return char;
  }

  function smallToNormal(char) {
    for (const c of 'ぁぃぅぇぉっゃゅょゎ') {
      if (char == c) {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + 1);
      }
    }
    return char;
  }

  function dakutenToNormal(char) {
    for (const c of 'がぎぐげござじずぜぞだぢづでどばびぶべぼ') {
      if (char == c) {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 1);
      }
    }
    for (const c of 'ぱぴぷぺぽ') {
      if (char == c) {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 2);
      }
    }
    if (char == 'ゔ') {
      return 'う';
    }
    return char;
  }

  function getCharPos(char) {
    if (optionKatakana) {
      char = katakanaToHiragana(char);
    }
    if (optionSmall) {
      char = smallToNormal(char);
    }
    if (optionDakuten) {
      char = dakutenToNormal(char);
    }
    let pos = charPos[char];
    if (pos === undefined) pos = charPos[charOther];
    return pos;
  }

  // オプション用の変数を更新
  function updateOptions() {
    optionKatakana = elemCheckboxKatakana.checked;
    optionSmall = elemCheckboxSmall.checked;
    optionDakuten = elemCheckboxDakuten.checked;
  }

  function updateResult() {
    updateOptions();

    // 過去の結果を削除
    const elemResult = document.getElementById('result');
    if (elemResult !== null) elemResult.remove();

    // 現在の結果を追加
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', 'result');
    const text = elemText.value;
    let posPrev;
    if (text.length != 0) {
      const pos = getCharPos(text[0]);
      posPrev = pos;
      const circle = createCircle({cx: pos.x, cy: pos.y, r: sizeFirstPoint});
      circle.setAttribute('fill', 'red');
      circle.setAttribute('stroke', 'none');
      g.appendChild(circle);
    }
    for (let i = 1; i < text.length; ++i) {
      const pos = getCharPos(text[i]);
      const circle = createCircle({cx: pos.x, cy: pos.y, r: sizePoint});
      circle.setAttribute('fill', 'red');
      circle.setAttribute('stroke', 'none');
      g.appendChild(circle);

      const line = createLine({x1: posPrev.x, y1: posPrev.y, x2: pos.x, y2: pos.y});
      line.setAttribute('stroke', 'red');
      line.setAttribute('stroke-width', '1');
      g.appendChild(line);

      posPrev = pos;
    }
    elemSvg.appendChild(g);
  }

  function init() {
    document.getElementById('versionInfo').innerText = version;

    elemSvg = document.getElementById('svgMain');
    elemText = document.getElementById('inputText');
    elemText.addEventListener('change', updateResult, false);
    elemCheckboxKatakana = document.getElementById('checkboxKatakana');
    elemCheckboxKatakana.addEventListener('change', updateResult, false);
    elemCheckboxSmall = document.getElementById('checkboxSmall');
    elemCheckboxSmall.addEventListener('change', updateResult, false);
    elemCheckboxDakuten = document.getElementById('checkboxDakuten');
    elemCheckboxDakuten.addEventListener('change', updateResult, false);
    document.addEventListener('keyup', updateResult, false);
    document.addEventListener('mouseup', updateResult, false);

    const g = document.createElementNS(SVG_NS, 'g');
    {
      const rect = createRect({x: 0, y: 0, width: 500, height: 300});
      rect.setAttribute('fill', '#eee');
      rect.setAttribute('stroke', 'none');
      g.appendChild(rect);
    }
    for (let col = 0; col < table.length; ++col) {
      for (let row = 0; row < 6; ++row) {
        const char = table[col][row];
        if (char == '　') continue;
        const x = 440 - col * blockSize + (char == charOther ? -20 : 0);
        const y = 20 + row * blockSize + (char == charOther ? 20 : 0);
        charPos[char] = {x: x + blockSize / 2, y: y + blockSize / 2};

        const rect = createRect({x: x, y: y, width: blockSize, height: blockSize});
        rect.setAttribute('fill', 'white');
        rect.setAttribute('stroke', 'black');
        rect.setAttribute('stroke-width', '2');
        if (char == charOther) {
          rect.setAttribute('fill', '#fdf');
        }
        g.appendChild(rect);

        const text = createText({x: x + 8, y: y + 30, text: char});
        text.setAttribute('font-size', '24px');
        text.setAttribute('font-weight', 'bold');
        g.appendChild(text);
      }
    }
    elemSvg.appendChild(g);
  }
})();
