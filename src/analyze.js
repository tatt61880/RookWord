(function () {
  'use strict';

  const charTable = [
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
    'ん　　　他',
  ];
  const defaultOptions = Object.freeze({
    diamond: true,
    arc: false,
    katakana: true,
    small: true,
    dakuten: true,
    choonpu: true,
    samePos: true,
    ignoreSpace: true,
  });
  const pieces = [
    { id: 'rook', name: 'ルーク', symbol: '♖' },
    { id: 'bishop', name: 'ビショップ', symbol: '♗' },
    { id: 'king', name: 'キング', symbol: '♔' },
    { id: 'queen', name: 'クイーン', symbol: '♕' },
    { id: 'knight', name: 'ナイト', symbol: '♘' },
  ];
  const positions = new Map();
  charTable.forEach((column, x) => {
    Array.from(column).forEach((char, y) => {
      if (char !== '　' && char !== '他') positions.set(char, { x: 10 - x, y });
    });
  });
  const segmenter =
    typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
      : null;

  function splitCharacters(text) {
    if (segmenter)
      return Array.from(segmenter.segment(text), (part) => part.segment);
    return (
      text.normalize('NFC').match(/[\s\S][\u3099\u309a\uff9e\uff9f]*/gu) || []
    );
  }

  function normalizeKana(source, options) {
    let char = source.normalize('NFC');
    if (options.katakana) {
      // Limit compatibility normalization to half-width kana.
      char = char.replace(/[\uff66-\uff9f]+/gu, (part) =>
        part.normalize('NFKC')
      );
      char = Array.from(char.normalize('NFD'), (letter) => {
        const code = letter.codePointAt(0);
        return code >= 0x30a1 && code <= 0x30f6
          ? String.fromCodePoint(code - 0x60)
          : letter;
      })
        .join('')
        .normalize('NFC');
    }
    if (options.dakuten) {
      char = char
        .normalize('NFD')
        .replace(/[\u3099\u309a]/gu, '')
        .normalize('NFC');
    }
    if (options.small) {
      const index = 'ぁぃぅぇぉっゃゅょゎゕゖ'.indexOf(char);
      if (char.length === 1 && index !== -1)
        char = 'あいうえおつやゆよわかけ'[index];
    }
    return char;
  }

  function allowsMove(id, from, to, samePos) {
    const dx = Math.abs(from.x - to.x);
    const dy = Math.abs(from.y - to.y);
    if (dx === 0 && dy === 0) return samePos;
    switch (id) {
      case 'rook':
        return dx === 0 || dy === 0;
      case 'bishop':
        return dx === dy;
      case 'king':
        return dx <= 1 && dy <= 1;
      case 'queen':
        return dx === 0 || dy === 0 || dx === dy;
      case 'knight':
        return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
      default:
        return false;
    }
  }

  function addDistance(terms, from, to) {
    let root = (from.x - to.x) ** 2 + (from.y - to.y) ** 2;
    if (root === 0) return;
    let coefficient = 1;
    for (let factor = 2; factor * factor <= root; factor++) {
      while (root % (factor * factor) === 0) {
        root /= factor * factor;
        coefficient *= factor;
      }
    }
    terms.set(root, (terms.get(root) || 0) + coefficient);
  }

  function distanceExpression(terms) {
    const sorted = Array.from(terms).sort((a, b) => a[0] - b[0]);
    if (sorted.length === 0) return '0';
    const exact = sorted
      .map(([root, coefficient]) =>
        root === 1
          ? String(coefficient)
          : `${coefficient === 1 ? '' : coefficient}√${root}`
      )
      .join(' + ');
    if (sorted.every(([root]) => root === 1)) return exact;
    const sum = sorted.reduce(
      (total, [root, coefficient]) => total + coefficient * Math.sqrt(root),
      0
    );
    return `${exact} ≒ ${Math.round(sum * 1000) / 1000}`;
  }

  function analyze(text, settings = {}, removedText = '') {
    const options = { ...defaultOptions, ...settings };
    const removed = new Set(
      splitCharacters(removedText).map((char) => normalizeKana(char, options))
    );
    const tokens = [];
    const matches = new Set(pieces.map((piece) => piece.id));
    const terms = new Map();
    let firstRookFailure = null;
    let previous = null;

    for (const source of splitCharacters(text)) {
      if (options.ignoreSpace && /^\s+$/u.test(source)) continue;
      let normalized = normalizeKana(source, options);
      if (options.choonpu && normalized === 'ー' && previous?.position) {
        normalized =
          previous.normalized === 'ん'
            ? 'ん'
            : 'あいうえお'[previous.position.y];
      }
      const position = removed.has(normalized)
        ? null
        : positions.get(normalized) || null;
      const token = { source, normalized, position };
      if (!position) matches.clear();
      if (position && previous?.position) {
        for (const piece of pieces) {
          if (
            !allowsMove(piece.id, previous.position, position, options.samePos)
          ) {
            matches.delete(piece.id);
            if (piece.id === 'rook' && firstRookFailure === null)
              firstRookFailure = tokens.length;
          }
        }
        addDistance(terms, previous.position, position);
      }
      tokens.push(token);
      previous = token;
    }

    const unknown = tokens.filter((token) => !token.position);
    return {
      tokens,
      unknown,
      firstRookFailure,
      matches:
        tokens.length === 0
          ? []
          : pieces.filter((piece) => matches.has(piece.id)),
      distance: unknown.length > 0 ? null : distanceExpression(terms),
      removed,
    };
  }

  const api = {
    analyze,
    charTable,
    defaultOptions,
    normalizeKana,
    splitCharacters,
  };
  if (typeof window !== 'undefined')
    window.app = Object.assign(window.app || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();
