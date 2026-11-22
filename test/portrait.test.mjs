import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPortraitSvg, fitGuestName, cardFilename } from '../lib/portrait.mjs';
import { generateInvitations } from '../lib/generate-invitations.mjs';

test('generates a complete image and matching personalized link in either language', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'invitation-test-'));
  try {
    const images = [];
    for (const language of ['vi', 'en']) {
      const result = await generateInvitations({ siteUrl: 'https://example.com/invitation/',
        guests: ['Đình Quang', 'Đình Quang'.normalize('NFD')], defaultLanguage: language,
        previewVersion: 'test.7', destination });
      assert.equal(result.length, 1);
      const [entry] = JSON.parse(await readFile(join(destination, 'invitation-links.json'), 'utf8'));
      const url = new URL(entry.url);
      assert.equal(url.searchParams.get('to'), entry.name);
      assert.equal(url.searchParams.get('lang'), language);
      assert.equal(url.searchParams.get('v'), 'test.7');
      const png = await readFile(join(destination, entry.image));
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(png.readUInt32BE(16), 1080);
      assert.equal(png.readUInt32BE(20), 1620);
      assert.ok(png.length > 10000);
      images.push(png);
      const manifest = await readFile(join(destination, 'invitation-links.txt'), 'utf8');
      assert.ok(manifest.includes(entry.name) && manifest.includes(entry.image) && manifest.includes(entry.url));
    }
    assert.notDeepEqual(images[0], images[1]);
  } finally { await rm(destination, { recursive: true, force: true }); }
});

test('keeps long names inside the reserved name area, including unbroken text', () => {
  for (const name of ['Nguyễn Hoàng Đặng Thùy Dương cùng các bạn thân yêu', 'W'.repeat(120)]) {
    const fit = fitGuestName(name);
    assert.ok(fit.widths.every((width) => width <= 810));
    assert.ok(fit.lines.length * fit.lineHeight <= 105);
    assert.equal(fit.lines.join('').replaceAll(' ', ''), name.replaceAll(' ', ''));
  }
});

test('treats guest names as text and uses safe distinct Windows filenames', () => {
  const name = 'Bạn <script> & "An"';
  const svg = createPortraitSvg(name);
  assert.ok(svg.includes('&lt;script&gt;') && svg.includes('&amp;') && svg.includes('&quot;An&quot;'));
  assert.ok(!svg.includes('<script>'));
  const filename = cardFilename('../../CON:<a>?*|\\');
  assert.match(filename, /^001-[a-z0-9-]+\.png$/);
  assert.notEqual(cardFilename('Ánh'), cardFilename('Anh'));
  assert.equal(cardFilename('Ánh'), cardFilename('Ánh'.normalize('NFD')));
  assert.match(createPortraitSvg('Bạn A', 'en'), /See you on campus!/);
  assert.match(createPortraitSvg('Bạn A', 'vi'), /Hẹn gặp bạn ở sân trường!/);
});
