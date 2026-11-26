import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortraitSvg, parseCardType, renderFamilyPreview } from '../lib/portrait.mjs';

const html = readFileSync(new URL('../docs/family/index.html', import.meta.url), 'utf8');
const translations = JSON.parse(html.match(/<script id="invitation-translations" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('family invitation covers every text binding in both languages', () => {
  assert.deepEqual(Object.keys(translations.vi).sort(), Object.keys(translations.en).sort());
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
  for (const [, binding] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const item of binding.split(';')) keys.push(item.split(':')[1]);
  }
  for (const lang of ['vi', 'en']) {
    for (const key of keys) assert.equal(typeof translations[lang][key], 'string', lang + ': ' + key);
  }
});

test('family invitation shows the dinner details without the campus parking guide', () => {
  assert.match(html, /<span class="date-number">28<\/span>/);
  assert.equal(translations.vi.timeValue, '18:00');
  assert.match(html, /14 Einstein/);
  assert.match(html, /'DTSTART:' \+ eventStart/);
  assert.match(html, /const eventStart = '20261128T110000Z'/);
  assert.doesNotMatch(html, /DTEND/);
  assert.doesNotMatch(html, /campus-arrival|parking|gửi xe/i);
  assert.doesNotMatch(html, /__LOGO__/);
  assert.match(html, /assets\/family-preview-vi\.png/);
});

test('family portrait uses the formal dinner copy and escapes names', () => {
  const svg = createPortraitSvg('Bác <Hai>', 'vi', 'family');
  assert.match(svg, /KÍNH GỬI/);
  assert.match(svg, /Nhà hàng Sesan/);
  assert.match(svg, />18:00</);
  assert.match(svg, />28</);
  assert.ok(svg.includes('Bác &lt;Hai&gt;'));
  assert.match(createPortraitSvg('Uncle Hai', 'en', 'family'), /Sesan Restaurant/);
  assert.throws(() => parseCardType('wedding'), /Loại thiệp/);
  const png = renderFamilyPreview();
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});
