import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvitationLinks, validateGuests } from '../lib/invitations.mjs';

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
