(function() {
  'use strict';
  const version = 'Version: 2022.04.27-b';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  window.addEventListener('load', init, false);

  const blockSize = 40;
  const sizePoint = 3;
  const sizePointEdge = 7;
  const charOther = '他';

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
    'ん　　　' + charOther,
  ];

  const charPos = {};

  let posPrev;
  let posOther;
  const classOther = 'other';

  let textPrev;
  let dists = [];

  let elemCheckboxKatakana;
  let elemCheckboxSmall;
  let elemCheckboxDakuten;
  let elemCheckboxChoonpu;
  let elemCheckboxSamePos;
  let elemCheckboxIgnoreSpace;
  let elemCheckboxDiamond;
  let elemCheckboxArc;

  let elemText;
  let elemSvg;
  let elemCharOther;
  let elemResultInfo;
  let elemDistInfo;

  let optionKatakana;
  let optionSmall;
  let optionDakuten;
  let optionChoonpu;
  let optionSamePos;
  let optionIgnoreSpace;
  let optionDiamond;
  let optionArc;

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

  function createDiamond(param) {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    const cx = param.cx;
    const cy = param.cy;
    const size = param.size;
    polygon.setAttribute('points', `${cx},${cy + size} ${cx + size},${cy} ${cx},${cy - size} ${cx - size},${cy}`);
    return polygon;
  }

  function dist(pos1, pos2) {
    return ((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2) ** 0.5;
  }

  function createLine(param) {
    if (optionArc) {
      const path = document.createElementNS(SVG_NS, 'path');
      const rx = 3 * dist({x: param.x1, y: param.y1}, {x: param.x2, y: param.y2});
      const ry = rx;
      path.setAttribute('d', `M ${param.x1} ${param.y1} A ${rx} ${ry} 0 0 0 ${param.x2} ${param.y2}`);
      path.setAttribute('fill', 'none');
      return path;
    } else {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', param.x1);
      line.setAttribute('y1', param.y1);
      line.setAttribute('x2', param.x2);
      line.setAttribute('y2', param.y2);
      return line;
    }
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
    if (0x30A1 <= code && code <= 0x30FA) {
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

  function isSamePos(pos1, pos2) {
    return pos1.x == pos2.x && pos1.y == pos2.y;
  }

  function choonpuPos() {
    if (isSamePos(posPrev, charPos['ん'])) return charPos['ん']; // 「んー」の場合は「ん」のまま。

    for (const c of 'あいうえお') {
      if (posPrev.y == charPos[c].y) {
        return charPos[c];
      }
    }
    return posPrev;
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

    if (optionChoonpu) {
      if (char == 'ー') {
        pos = choonpuPos();
      }
    }

    if (pos === undefined) {
      pos = posOther;
    }
    return pos;
  }

  // オプション用の変数を更新
  function updateOptions() {
    optionKatakana = elemCheckboxKatakana.checked;
    optionSmall = elemCheckboxSmall.checked;
    optionDakuten = elemCheckboxDakuten.checked;
    optionChoonpu = elemCheckboxChoonpu.checked;
    optionSamePos = elemCheckboxSamePos.checked;
    optionIgnoreSpace = elemCheckboxIgnoreSpace.checked;
    optionDiamond = elemCheckboxDiamond.checked;
    optionArc = elemCheckboxArc.checked;
  }

  function isRookMove(pos1, pos2) {
    if (isSamePos(pos1, pos2)) return optionSamePos;
    return pos1.x == pos2.x || pos1.y == pos2.y;
  }
  function isBishopMove(pos1, pos2) {
    if (isSamePos(pos1, pos2)) return optionSamePos;
    return Math.abs(pos1.x - pos2.x) == Math.abs(pos1.y - pos2.y);
  }
  function isKingMove(pos1, pos2) {
    if (isSamePos(pos1, pos2)) return optionSamePos;
    return Math.abs(pos1.x - pos2.x) <= blockSize && Math.abs(pos1.y - pos2.y) <= blockSize;
  }
  function isQueenMove(pos1, pos2) {
    return isRookMove(pos1, pos2) || isBishopMove(pos1, pos2);
  }
  function isKnightMove(pos1, pos2) {
    if (isSamePos(pos1, pos2)) return optionSamePos;
    const dx = Math.abs(pos1.x - pos2.x) / blockSize;
    const dy = Math.abs(pos1.y - pos2.y) / blockSize;
    return dx == 1 && dy == 2 || dx == 2 && dy == 1;
  }

  function isSpace(char) {
    return char == ' ' || char == '　';
  }

  function clearDist() {
    dists = [];
  }

  const gcd = (x, y) => { return x % y ? gcd(y, x % y) : y; };

  function addDistSub(i, val) {
    if (dists[i] === undefined) {
      dists[i] = val;
    } else {
      dists[i] += val;
    }
  }

  function addDist(pos1, pos2) {
    let dx = Math.abs(pos1.x - pos2.x) / blockSize;
    let dy = Math.abs(pos1.y - pos2.y) / blockSize;

    if (dx == 0) {
      addDistSub(1, dy);
    } else if (dy == 0) {
      addDistSub(1, dx);
    } else {
      let div = gcd(dx, dy);
      dx /= div;
      dy /= div;
      let num = dx ** 2 + dy ** 2;
      for (let i = 2; i * i <= num; ++i) {
        while (num % (i * i) == 0) {
          num /= i * i;
          div *= i;
        }
      }
      addDistSub(num, div);
    }
  }

  function getDistExpr() {
    let res = '';
    let flag = false;
    let v = 0;
    for (let i = 1; i < dists.length; ++i) {
      const val = dists[i];
      if (val === undefined) continue;
      if (val == 0) continue;
      let str = '';
      v += val * i ** 0.5;
      if (i == 1) {
        str = val;
      } else {
        if (val != 1) {
          str = val;
        }
        str += `√${i}`;
        flag = true;
      }
      if (res != '') res += ' + ';
      res += str;
    }
    if (res == '') res = '0';
    if (flag) {
      res += ' ≒ ' + Math.round(v * 1000) / 1000;
    }
    return res;
  }

  function updateResultIfChanged() {
    const text = elemText.value;
    if (text == textPrev) return;
    textPrev = text;
    updateResult();
  }

  function updateResult() {
    updateOptions();
    clearDist();

    const text = elemText.value;

    let isRookWord = true;
    let isBishopWord = true;
    let isKingWord = true;
    let isQueenWord = true;
    let isKnightWord = true;

    let hasValidChar = false;
    let hasOtherChar = false;
    let validCharCount = 0;

    const resultId = 'result';

    // 過去の結果を削除
    const elemResult = document.getElementById(resultId);
    if (elemResult !== null) elemResult.remove();

    // 現在の結果を追加
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', resultId);
    elemCharOther.style.display = 'none';
    posPrev = posOther;
    let isFirstChar = true;
    for (const char of text) {
      if (optionIgnoreSpace && isSpace(char)) continue;
      hasValidChar = true;
      validCharCount++;
      const pos = getCharPos(char);
      if (isSamePos(pos, posOther)) {
        hasOtherChar = true;
        elemCharOther.style.display = 'block';
        isRookWord = false;
        isBishopWord = false;
        isKingWord = false;
        isQueenWord = false;
        isKnightWord = false;
      }

      if (optionDiamond && isFirstChar) {
        const polygon = createDiamond({cx: pos.x, cy: pos.y, size: sizePointEdge});
        polygon.setAttribute('fill', 'yellow');
        polygon.setAttribute('stroke', 'red');
        g.appendChild(polygon);
      } else {
        const circle = createCircle({cx: pos.x, cy: pos.y, r: sizePoint});
        circle.setAttribute('fill', 'red');
        circle.setAttribute('stroke', 'none');
        g.appendChild(circle);
      }

      if (!isFirstChar) {
        if (isRookWord && !isRookMove(pos, posPrev)) isRookWord = false;
        if (isBishopWord && !isBishopMove(pos, posPrev)) isBishopWord = false;
        if (isKingWord && !isKingMove(pos, posPrev)) isKingWord = false;
        if (isQueenWord && !isQueenMove(pos, posPrev)) isQueenWord = false;
        if (isKnightWord && !isKnightMove(pos, posPrev)) isKnightWord = false;

        if (!hasOtherChar) addDist(pos, posPrev);

        const line = createLine({x1: posPrev.x, y1: posPrev.y, x2: pos.x, y2: pos.y});
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);
      }

      posPrev = pos;
      isFirstChar = false;
    }

    if (optionDiamond && hasValidChar) {
      const polygon = createDiamond({cx: posPrev.x, cy: posPrev.y, size: sizePointEdge});
      polygon.setAttribute('fill', 'yellow');
      polygon.setAttribute('stroke', 'red');
      g.appendChild(polygon);
    }
    elemSvg.appendChild(g);

    elemResultInfo.innerText = '';
    if (!hasValidChar) {
      elemResultInfo.innerText = '　';
    } else if (isRookWord) {
      elemResultInfo.innerText = `♖｢${text}｣はルーク語です♜`;
    } else if (isBishopWord) {
      elemResultInfo.innerText = `♗｢${text}｣はビショップ語です♝`;
    } else if (isKingWord) {
      elemResultInfo.innerText = `♔｢${text}｣はキング語です♚`;
    } else if (isQueenWord) {
      elemResultInfo.innerText = `♕｢${text}｣はクイーン語です♛`;
    } else if (isKnightWord) {
      elemResultInfo.innerText = `♘｢${text}｣はナイト語です♞`;
    } else {
      elemResultInfo.innerText = '　';
    }

    if (!hasValidChar) {
      elemDistInfo.innerText = '　';
    } else if (hasOtherChar) {
      elemDistInfo.innerText = `文字数: ${validCharCount}文字`;
    } else {
      elemDistInfo.innerText = `移動距離: ${getDistExpr()} マス (${validCharCount}文字)`;
    }
  }

  function init() {
    textPrev = '';
    document.getElementById('versionInfo').innerText = version;

    elemText = document.getElementById('inputText');
    elemText.addEventListener('change', updateResultIfChanged, false);
    document.addEventListener('keyup', updateResultIfChanged, false);
    document.addEventListener('mouseup', updateResultIfChanged, false);

    elemSvg = document.getElementById('svgMain');

    elemCheckboxKatakana = document.getElementById('checkboxKatakana');
    elemCheckboxKatakana.addEventListener('change', updateResult, false);
    elemCheckboxSmall = document.getElementById('checkboxSmall');
    elemCheckboxSmall.addEventListener('change', updateResult, false);
    elemCheckboxDakuten = document.getElementById('checkboxDakuten');
    elemCheckboxDakuten.addEventListener('change', updateResult, false);
    elemCheckboxChoonpu = document.getElementById('checkboxChoonpu');
    elemCheckboxChoonpu.addEventListener('change', updateResult, false);
    elemCheckboxSamePos = document.getElementById('checkboxSamePos');
    elemCheckboxSamePos.addEventListener('change', updateResult, false);
    elemCheckboxIgnoreSpace = document.getElementById('checkboxIgnoreSpace');
    elemCheckboxIgnoreSpace.addEventListener('change', updateResult, false);
    elemCheckboxDiamond = document.getElementById('checkboxDiamond');
    elemCheckboxDiamond.addEventListener('change', updateResult, false);
    elemCheckboxArc = document.getElementById('checkboxArc');
    elemCheckboxArc.addEventListener('change', updateResult, false);

    elemResultInfo = document.getElementById('resultInfo');
    elemDistInfo = document.getElementById('distInfo');

    {
      const rect = createRect({x: 0, y: 0, width: 480, height: 240});
      rect.setAttribute('fill', '#eee');
      rect.setAttribute('stroke', 'none');
      elemSvg.appendChild(rect);
    }
    for (let col = 0; col < table.length; ++col) {
      for (let row = 0; row < 5; ++row) {
        const g = document.createElementNS(SVG_NS, 'g');
        const char = table[col][row];
        if (char == '　') continue;
        const x = 420 - col * blockSize + (char == charOther ? blockSize * 0.5 : 0);
        const y = 20 + row * blockSize + (char == charOther ? -blockSize * 1.5 : 0);
        charPos[char] = {x: x + blockSize / 2, y: y + blockSize / 2};

        const rect = createRect({x: x, y: y, width: blockSize, height: blockSize});
        rect.setAttribute('fill', 'white');
        rect.setAttribute('stroke', 'black');
        rect.setAttribute('stroke-width', '2');
        if (char == charOther) {
          rect.setAttribute('fill', '#fdf');
          elemCharOther = g;
        }
        g.appendChild(rect);

        const text = createText({x: x + 8, y: y + 30, text: char});
        text.setAttribute('font-size', '24px');
        text.setAttribute('font-weight', 'bold');
        if (char == charOther) {
          text.classList.add(classOther);
        }
        g.appendChild(text);
        elemSvg.appendChild(g);
      }
    }

    posOther = charPos[charOther];
  }
})();
