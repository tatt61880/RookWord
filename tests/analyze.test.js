const assert = require('node:assert/strict');
const test = require('node:test');
const { analyze, defaultOptions } = require('../src/analyze.js');
const { getQueryParams, createShareUrl } = require('../src/analyze-url.js');

const normalized = (result) =>
  result.tokens.map((token) => token.normalized).join('');

test('known examples remain rook words', () => {
  for (const text of ['いあいぎり', 'かくう', 'ルークご', 'ツール']) {
    assert.equal(analyze(text).matches[0].id, 'rook', text);
  }
  assert.equal(analyze('いあいぎり').distance, '10');
});

test('piece priority and all move geometries', () => {
  const cases = [
    ['あお', ['rook', 'queen']],
    ['あす', ['bishop', 'queen']],
    ['あきく', ['king', 'queen']],
    ['あく', ['knight']],
    ['あきお', []],
  ];
  for (const [text, expected] of cases) {
    assert.deepEqual(
      analyze(text).matches.map((piece) => piece.id),
      expected,
      text
    );
  }
});

test('distance simplifies radicals and does not add zero terms', () => {
  assert.equal(analyze('あす').distance, '2√2 ≒ 2.828');
  assert.equal(analyze('ああき').distance, '√2 ≒ 1.414');
  assert.equal(analyze('ああ').distance, '0');
  assert.equal(analyze('あいき').distance, '2');
});

test('same-position option is applied to every piece', () => {
  assert.equal(analyze('ああ').matches.length, 5);
  const result = analyze('ああ', { samePos: false });
  assert.deepEqual(result.matches, []);
  assert.equal(result.firstRookFailure, 1);
});

test('half-width, composed and decomposed kana agree', () => {
  for (const text of ['がぱヴァ', 'か\u3099は\u309aウ\u3099ァ', 'ｶﾞﾊﾟｳﾞｧ']) {
    const result = analyze(text);
    assert.equal(normalized(result), 'かはうあ');
    assert.equal(result.tokens.length, 4);
    assert.equal(result.unknown.length, 0);
  }
  assert.equal(normalized(analyze('ヷヺヵヶ')), 'わをかけ');
});

test('normalization options can be disabled independently', () => {
  assert.equal(analyze('カｶ', { katakana: false }).unknown.length, 2);
  assert.equal(analyze('がか\u3099ｶﾞ', { dakuten: false }).unknown.length, 3);
  assert.equal(analyze('ぁァｧ', { small: false }).unknown.length, 3);
  assert.equal(analyze('かー', { choonpu: false }).unknown.length, 1);
  assert.equal(analyze('①㋐').unknown.length, 2);
});

test('long vowels need a supported previous character', () => {
  for (const text of ['ー', 'ーあ', '漢ー', '他ー', '😀ー']) {
    assert.equal(analyze(text).tokens[0].position, null, text);
    assert.equal(analyze(text).distance, null, text);
    assert.deepEqual(analyze(text).matches, [], text);
  }
  assert.equal(analyze('漢ー').tokens[1].position, null);
  assert.equal(normalized(analyze('ルーーク')), 'るううく');
  assert.equal(normalized(analyze('んー')), 'んん');
  assert.equal(normalized(analyze('ｺｰﾋｰ')), 'こおひい');
});

test('empty and ignored whitespace do not make a word', () => {
  for (const text of ['', ' \t\r\n　'])
    assert.deepEqual(analyze(text).matches, []);
  assert.equal(analyze('あ\r\n\t 　い').tokens.length, 2);
  assert.equal(analyze('あ\tい', { ignoreSpace: false }).unknown.length, 1);
});

test('emoji and combining characters count as graphemes', () => {
  assert.equal(analyze('👨‍👩‍👧‍👦🇯🇵👍🏽').tokens.length, 3);
  assert.equal(analyze('か\u3099').tokens.length, 1);
});

test('removed characters also affect vowel substitutions and normalize consistently', () => {
  assert.equal(analyze('ルーク', {}, 'う').tokens[1].position, null);
  assert.equal(analyze('か', {}, 'ｶﾞ').tokens[0].position, null);
  assert.equal(analyze('んー', {}, 'ん').unknown.length, 2);
  assert.equal(analyze('他', {}, '他').unknown.length, 1);
});

test('first invalid rook transition identifies its location', () => {
  assert.equal(analyze('あいく').firstRookFailure, 2);
  assert.equal(analyze('あいき').firstRookFailure, null);
});

test('query parser does not double-decode or crash on malformed input', () => {
  assert.deepEqual(getQueryParams('?text=100%25%20%26%20a%3Db%2Bc'), {
    text: '100% & a=b+c',
  });
  assert.equal(getQueryParams('?text=%2520').text, '%20');
  assert.equal(getQueryParams('?text=a+b').text, 'a b');
  assert.doesNotThrow(() => getQueryParams('?removed=%E0%A4%A&flag&text=%'));
  assert.equal(getQueryParams('?flag').flag, '');
});

test('share URL restores exact text, all options and exclusions', () => {
  const text = 'ルーク\n100% & a=b+c # 😀';
  const options = { ...defaultOptions, arc: true, ignoreSpace: false };
  const url = createShareUrl(
    'https://example.com/RookWord/?stale=1#old',
    text,
    options,
    'うを'
  );
  const parsed = getQueryParams(new URL(url).search);
  assert.equal(parsed.text, text);
  assert.equal(parsed.removed, 'うを');
  for (const [name, value] of Object.entries(options))
    assert.equal(parsed[name], value ? '1' : '0');
  assert.equal(new URL(url).hash, '');
  assert.equal(parsed.stale, undefined);
});
