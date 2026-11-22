import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvitationLinks, validateGuests, parseGuestNames, parseLanguage, DEFAULT_PREVIEW_VERSION } from '../lib/invitations.mjs';

test('Vietnamese names and URL punctuation remain one recipient parameter', () => {
  const name = 'Quốc Bảo & An + Bình #1';
  const [{ url }] = buildInvitationLinks('https://example.github.io/invitation/', [name]);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/invitation/');
  assert.equal(parsed.searchParams.get('to'), name);
  assert.equal(parsed.searchParams.get('v'), DEFAULT_PREVIEW_VERSION);
  assert.equal(parsed.searchParams.get('lang'), 'vi');
  assert.deepEqual([...parsed.searchParams.keys()], ['to', 'v', 'lang']);
});

test('normalizes Unicode and avoids duplicate links', () => {
  const original = 'Như Mai';
  assert.deepEqual(validateGuests([` ${original} `, original.normalize('NFD')]), [original]);
});

test('rejects invalid guest configuration and unsupported URL schemes', () => {
  assert.throws(() => validateGuests('Minh Anh'));
  assert.throws(() => validateGuests(['']));
  assert.throws(() => validateGuests(['Minh\nAnh']));
  assert.throws(() => validateGuests(['a'.repeat(121)]));
  assert.throws(() => buildInvitationLinks('javascript:alert(1)', ['A']));
});

test('starts with a clean shared URL and allows an empty guest list', () => {
  const [{ url }] = buildInvitationLinks('https://example.github.io/invitation/?to=Old#map', ['New']);
  assert.equal(new URL(url).searchParams.get('to'), 'New');
  assert.equal(new URL(url).hash, '');
  assert.deepEqual(buildInvitationLinks('http://127.0.0.1:4173/', []), []);
});

test('accepts unquoted bracketed lists from the env file', () => {
  assert.deepEqual(parseGuestNames('[Bạn A, Bạn B, Bạn C]'), ['Bạn A', 'Bạn B', 'Bạn C']);
});

test('accepts comma or newline separated names and apostrophes', () => {
  assert.deepEqual(parseGuestNames(" Bạn A, O'Connor\nBạn B, "), ['Bạn A', "O'Connor", 'Bạn B']);
  assert.deepEqual(parseGuestNames(''), []);
});

test('preserves valid JSON including commas inside a name', () => {
  assert.deepEqual(parseGuestNames('["Bạn A, nhóm 1", "Bạn B"]'), ['Bạn A, nhóm 1', 'Bạn B']);
  assert.deepEqual(parseGuestNames('[]'), []);
  assert.throws(() => parseGuestNames('[123]'), /chuỗi tên/);
});

test('reports malformed mixed JSON rather than corrupting names', () => {
  assert.throws(() => parseGuestNames('["Bạn A", Bạn B]'), /chưa đúng định dạng/);
  assert.throws(() => parseGuestNames('[Bạn A, Bạn B'), /thiếu dấu/);
  assert.throws(() => parseGuestNames('{"name":"Bạn A"}'), /chưa đúng định dạng/);
});

test('uses the selected preview version consistently for every recipient', () => {
  const links = buildInvitationLinks('https://example.github.io/invitation/', ['Bạn A', 'Bạn B'], 'next');
  assert.equal(links.length, 2);
  for (const {name, url} of links) {
    assert.equal(new URL(url).searchParams.get('v'), 'next');
    assert.equal(new URL(url).searchParams.get('to'), name);
  }
});

test('replaces stale URL versions with the configured version', () => {
  const [{url}] = buildInvitationLinks('https://example.github.io/invitation/?v=2&to=Old#map', ['Bạn A'], '2026-11-22.5');
  const parsed = new URL(url);
  assert.deepEqual(parsed.searchParams.getAll('v'), ['2026-11-22.5']);
  assert.equal(parsed.searchParams.get('to'), 'Bạn A');
  assert.equal(parsed.hash, '');
});

test('rejects empty or malformed preview versions with a clear error', () => {
  for (const version of ['', ' ', '5&to=Other']) {
    assert.throws(() => buildInvitationLinks('https://example.github.io/invitation/', ['Bạn A'], version), /PREVIEW_VERSION/);
  }
});

test('uses an explicit language so an old browser preference cannot override the invitation', () => {
  for (const language of ['vi', 'en']) {
    const [{ url }] = buildInvitationLinks('https://example.com/?lang=stale', ['Đình Quang'], '6', language);
    assert.deepEqual(new URL(url).searchParams.getAll('lang'), [language]);
  }
  assert.equal(parseLanguage(), 'vi');
  assert.equal(parseLanguage(' EN '), 'en');
  assert.throws(() => parseLanguage('fr'), /DEFAULT_LANGUAGE/);
});
