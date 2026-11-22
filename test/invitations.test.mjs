import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvitationLinks, validateGuests, parseGuestNames } from '../lib/invitations.mjs';

test('Vietnamese names and URL punctuation remain one recipient parameter', () => {
  const name = 'Quốc Bảo & An + Bình #1';
  const [{ url }] = buildInvitationLinks('https://example.github.io/invitation/', [name]);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/invitation/');
  assert.equal(parsed.searchParams.get('to'), name);
  assert.equal([...parsed.searchParams].length, 1);
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
