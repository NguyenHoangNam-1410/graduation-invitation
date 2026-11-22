import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const data = html.match(/<script id="invitation-translations" type="application\/json">([\s\S]*?)<\/script>/)[1];
const translations = JSON.parse(data);

test('Vietnamese and English cover every visible text and accessibility binding', () => {
  assert.deepEqual(Object.keys(translations.vi).sort(), Object.keys(translations.en).sort());
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
  for (const [, binding] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const item of binding.split(';')) keys.push(item.split(':')[1]);
  }
  for (const lang of ['vi', 'en']) {
    for (const key of keys) assert.equal(typeof translations[lang][key], 'string', lang + ': ' + key);
  }
  assert.ok(keys.length > 60);
});

test('Vietnamese is the static default while the main title remains English', () => {
  assert.match(html, /<html lang="vi"/);
  assert.match(html, /<h1 id="invitation-title">Graduation<span>Ceremony<\/span><\/h1>/);
  assert.match(html, /data-language="vi" aria-pressed="true"/);
  assert.match(html, /data-language="vi"[^>]*>VI<\/button>/);
  assert.match(html, /data-language="en"[^>]*>EN<\/button>/);
  assert.match(html, /data-map-vi="assets\/campus-arrival-vi.svg"/);
});

test('Vietnamese calendar text stays valid UTF-8 when folded into 75-byte lines', () => {
  const source = html.match(/    function escapeCalendarText[\s\S]*?(?=    const eventYear)/)[0];
  const context = vm.createContext({TextEncoder});
  vm.runInContext(source, context);
  const text = 'DESCRIPTION:' + context.escapeCalendarText(translations.vi.calendarDescription.repeat(3));
  const folded = context.foldCalendarLine(text);
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.equal(folded.replace(/\r\n /g, ''), text);
  assert.equal(context.escapeCalendarText('A, B; C\nD'), 'A\\, B\\; C\\nD');
});
