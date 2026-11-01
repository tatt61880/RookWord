(function () {
  'use strict';

  const app = window.app;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const options = { ...app.defaultOptions };
  const input = document.getElementById('input-text');
  const removedInput = document.getElementById('removed-text');
  const svg = document.getElementById('svg-main');
  const resultInfo = document.getElementById('result-info');
  const distInfo = document.getElementById('dist-info');
  const detailInfo = document.getElementById('detail-info');
  const feedback = document.getElementById('feedback');
  const shareField = document.getElementById('share-field');
  const saveButton = document.getElementById('save-image');
  const otherPosition = { x: 0.5, y: 2.5 };
  let current;
  let frame = null;

  function element(name, attributes = {}, text) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes))
      node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function coords(position) {
    const point = position || otherPosition;
    return { x: 40 + point.x * 40, y: 40 + point.y * 40 };
  }

  function drawBoard() {
    svg.replaceChildren();
    svg.appendChild(
      element('title', { id: 'board-title' }, '五十音表と文字の移動経路')
    );
    svg.appendChild(
      element(
        'desc',
        { id: 'board-description' },
        `${resultInfo.textContent}。${distInfo.textContent}`
      )
    );
    svg.appendChild(
      element('rect', { width: 480, height: 240, fill: '#f8faff' })
    );
    app.charTable.forEach((column, col) => {
      Array.from(column).forEach((char, row) => {
        if (char === '　') return;
        const isOther = char === '他';
        if (isOther ? current.unknown.length === 0 : current.removed.has(char))
          return;
        const { x, y } = coords(isOther ? null : { x: 10 - col, y: row });
        svg.appendChild(
          element('rect', {
            x: x - 20,
            y: y - 20,
            width: 40,
            height: 40,
            fill: isOther ? '#e0e9ff' : '#ffffff',
            stroke: '#333333',
            'stroke-width': 1.5,
          })
        );
        svg.appendChild(
          element(
            'text',
            {
              x,
              y: y + 2,
              'font-family': 'sans-serif',
              'font-size': 28,
              'font-weight': 'bold',
              'dominant-baseline': 'middle',
              'text-anchor': 'middle',
              fill: '#222222',
            },
            char
          )
        );
      });
    });

    const paths = element('g', {
      fill: 'none',
      stroke: '#d00032',
      'stroke-width': 1.8,
    });
    const points = element('g', { fill: '#d00032' });
    const seenEdges = new Set();
    const seenPoints = new Set();
    current.tokens.forEach((token, index) => {
      const to = coords(token.position);
      const pointKey = `${to.x},${to.y}`;
      if (!seenPoints.has(pointKey)) {
        seenPoints.add(pointKey);
        points.appendChild(element('circle', { cx: to.x, cy: to.y, r: 4 }));
      }
      if (index === 0) return;
      const from = coords(current.tokens[index - 1].position);
      const edgeKey = `${from.x},${from.y}:${pointKey}`;
      if (seenEdges.has(edgeKey) || (from.x === to.x && from.y === to.y))
        return;
      seenEdges.add(edgeKey);
      if (options.arc) {
        const radius = 3 * Math.hypot(to.x - from.x, to.y - from.y);
        paths.appendChild(
          element('path', {
            d: `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 0 ${to.x} ${to.y}`,
          })
        );
      } else {
        paths.appendChild(
          element('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y })
        );
      }
    });
    svg.append(paths, points);
    if (current.tokens.length > 0 && options.diamond) {
      for (const [token, color] of [
        [current.tokens[0], '#ffea70'],
        [current.tokens.at(-1), '#b8d1ff'],
      ]) {
        const { x, y } = coords(token.position);
        svg.appendChild(
          element('polygon', {
            points: `${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`,
            fill: color,
            stroke: '#2857aa',
            'stroke-width': 2,
          })
        );
      }
    }
  }

  function shortText(text, limit = 100) {
    const chars = app.splitCharacters(text);
    return chars.slice(0, limit).join('') + (chars.length > limit ? '…' : '');
  }

  function displayChar(char) {
    return char
      .replace(/\r\n|\n|\r/gu, '↵')
      .replace(/\t/gu, '⇥')
      .replace(/[ \u3000]/gu, '␣');
  }

  function update() {
    frame = null;
    shareField.hidden = true;
    feedback.textContent = '';
    current = app.analyze(input.value, options, removedInput.value);
    const count = current.tokens.length;
    const primary = current.matches[0];
    if (current.unknown.length > 0) {
      resultInfo.dataset.kind = 'unknown';
    } else if (primary) {
      resultInfo.dataset.kind = primary.id;
    } else {
      resultInfo.dataset.kind = 'none';
    }
    if (count === 0) {
      resultInfo.textContent = '文字を入力すると判定します';
    } else if (current.unknown.length) {
      resultInfo.textContent = '表にない文字があるため、判定できません';
    } else if (count === 1) {
      resultInfo.textContent = '移動なし（1文字）';
    } else if (primary) {
      resultInfo.textContent = `${primary.symbol} ${primary.name}語です`;
    } else {
      resultInfo.textContent = '該当する駒はありません';
    }

    if (count === 0) {
      distInfo.textContent = '';
    } else if (current.distance === null) {
      distInfo.textContent = `文字数: ${count}文字`;
    } else {
      distInfo.textContent = `移動距離: ${current.distance} マス ／ ${count}文字`;
    }

    const normalizedText = document.getElementById('normalized-text');
    if (count === 0) {
      normalizedText.textContent = '—';
    } else {
      const characters = current.tokens
        .map((token) => (token.position ? token.normalized : '他'))
        .join('');
      normalizedText.textContent = shortText(characters);
    }
    const details = [];
    if (current.unknown.length) {
      const chars = [
        ...new Set(current.unknown.map((token) => displayChar(token.source))),
      ];
      details.push(
        `「他」として扱う文字: ${chars
          .slice(0, 10)
          .map((char) => `「${char}」`)
          .join('、')}${chars.length > 10 ? ' ほか' : ''}`
      );
    }
    if (current.firstRookFailure !== null) {
      const i = current.firstRookFailure;
      const from = current.tokens[i - 1];
      const to = current.tokens[i];
      const same = from.normalized === to.normalized;
      details.push(
        `ルークでは動けない箇所: ${i}→${i + 1}文字目「${displayChar(
          from.source
        )}→${displayChar(to.source)}」${
          same ? '（同じ位置を許容しない設定）' : '（縦・横の両方が変わります）'
        }`
      );
    }
    if (count > 1 && current.matches.length > 1) {
      details.push(
        `ほかに成立: ${current.matches
          .slice(1)
          .map((piece) => `${piece.symbol} ${piece.name}`)
          .join('、')}`
      );
    }
    detailInfo.textContent = details.join('\n');
    document.getElementById('clear-text').disabled = input.value.length === 0;
    saveButton.disabled = count === 0;
    document.getElementById('endpoint-legend').hidden =
      !options.diamond || count === 0;
    drawBoard();
  }

  function scheduleUpdate(event) {
    if (event.isComposing) return;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }

  function flushUpdate() {
    if (frame !== null) cancelAnimationFrame(frame);
    update();
  }

  async function copyUrl() {
    flushUpdate();
    const url = app.createShareUrl(
      window.location.href,
      input.value,
      options,
      removedInput.value
    );
    const field = document.getElementById('share-url');
    field.value = url;
    try {
      await navigator.clipboard.writeText(url);
      feedback.textContent = '共有URLをコピーしました。';
    } catch {
      shareField.hidden = false;
      field.focus();
      field.select();
      feedback.textContent =
        'コピーできない場合は、下のURLを選択してコピーしてください。';
    }
  }

  async function saveImage() {
    flushUpdate();
    if (current.tokens.length === 0) return;
    saveButton.disabled = true;
    // Snapshot all labels before awaiting image loading.
    const labels = [
      shortText(input.value.replace(/\s+/gu, ' '), 24),
      resultInfo.textContent,
      distInfo.textContent,
    ];
    const imageUrl = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], {
        type: 'image/svg+xml;charset=utf-8',
      })
    );
    try {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 1440;
      canvas.height = 1110;
      const context = canvas.getContext('2d');
      context.scale(3, 3);
      context.fillStyle = '#f8faff';
      context.fillRect(0, 0, 480, 370);
      context.fillStyle = '#222222';
      context.textAlign = 'center';
      context.font = 'bold 20px sans-serif';
      context.fillText(labels[0], 240, 30, 450);
      context.drawImage(image, 0, 45, 480, 240);
      context.font = 'bold 17px sans-serif';
      context.fillText(labels[1], 240, 315, 450);
      context.font = '14px sans-serif';
      context.fillText(labels[2], 240, 341, 450);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Image conversion failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rook-word.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      feedback.textContent = 'PNG画像を作成しました。';
    } catch {
      feedback.textContent =
        '画像を保存できませんでした。もう一度お試しください。';
    } finally {
      URL.revokeObjectURL(imageUrl);
      saveButton.disabled = current.tokens.length === 0;
    }
  }

  const query = app.getQueryParams();
  input.value = query.text || '';
  removedInput.value = query.removed || '';
  for (const name of Object.keys(options)) {
    if (query[name] === '0' || query[name] === '1')
      options[name] = query[name] === '1';
    const checkbox = document.getElementById(`options-${name}`);
    checkbox.checked = options[name];
    checkbox.addEventListener('change', () => {
      options[name] = checkbox.checked;
      flushUpdate();
    });
  }
  for (const field of [input, removedInput]) {
    field.addEventListener('input', scheduleUpdate);
    field.addEventListener('compositionend', scheduleUpdate);
  }
  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.example;
      flushUpdate();
      input.focus();
    });
  });
  document.getElementById('clear-text').addEventListener('click', () => {
    input.value = '';
    flushUpdate();
    input.focus();
  });
  document.getElementById('reset-options').addEventListener('click', () => {
    Object.assign(options, app.defaultOptions);
    for (const name of Object.keys(options))
      document.getElementById(`options-${name}`).checked = options[name];
    removedInput.value = '';
    flushUpdate();
  });
  document.getElementById('copy-url').addEventListener('click', copyUrl);
  saveButton.addEventListener('click', saveImage);
  flushUpdate();
})();
