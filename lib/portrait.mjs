import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { parseLanguage, validateGuests } from './invitations.mjs';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1620;

// Load the same logo, ornaments and local fonts as the website. No network or
// installed system font is needed when generating an invitation.
const page = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const logo = page.match(/<img[^>]+src="(data:image\/svg\+xml;base64,[^"]+)"/)[1];
const corner = page.match(/<symbol id="i-corner"[\s\S]*?<\/symbol>/)[0];
const cap = page.match(/<svg class="cap-mark"[\s\S]*?<\/svg>/)[0]
  .replace('class="cap-mark"', 'x="850" y="325" width="138" height="128" color="#1488d8" opacity=".65"');
const fontDirectory = new URL('../docs/assets/fonts/', import.meta.url);
const fontOptions = {
  font: {
    loadSystemFonts: false,
    defaultFontFamily: 'Be Vietnam Pro',
    fontFiles: readdirSync(fontDirectory).filter((file) => file.endsWith('.ttf'))
      .map((file) => fileURLToPath(new URL(file, fontDirectory))),
  },
};
const measureOptions = {
  font: { loadSystemFonts: false, fontFiles: [fileURLToPath(new URL('be-vietnam-pro-500.ttf', fontDirectory))] },
};

const copy = {
  vi: {
    school: 'ĐẠI HỌC BÁCH KHOA', university: 'ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH', dear: 'THÂN MỜI BẠN',
    milestone: 'Có bạn, ngày này sẽ trọn vẹn hơn.',
    message: ['Đến chung vui trong ngày tốt nghiệp', 'và chụp cùng mình thật nhiều ảnh nhé!'],
    month: 'THÁNG 11', time: 'THỜI GIAN', timezone: 'Theo giờ Việt Nam', location: 'ĐỊA ĐIỂM',
    venue: 'Trường Đại học Bách khoa', address: ['268 Lý Thường Kiệt', 'Phường Diên Hồng, TP. Hồ Chí Minh'],
    phone: 'Điện thoại / Zalo: 0356 378 040', closing: 'Hẹn gặp bạn ở sân trường!',
  },
  en: {
    school: 'HO CHI MINH CITY', university: 'UNIVERSITY OF TECHNOLOGY · VNU-HCM', dear: 'DEAR',
    milestone: 'This day will be brighter with you there.',
    message: ['Come celebrate my graduation with me', 'and let’s take lots of photos together!'],
    month: 'NOVEMBER', time: 'TIME', timezone: 'Vietnam time · UTC+7', location: 'VENUE',
    venue: 'HCMC University of Technology', address: ['268 Ly Thuong Kiet Street', 'Dien Hong Ward, Ho Chi Minh City'],
    phone: 'Phone / Zalo: 0356 378 040', closing: 'See you on campus!',
  },
};

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

function text(value, x, y, size, attributes = '') {
  return `<text x="${x}" y="${y}" font-size="${size}" ${attributes}>${escapeXml(value)}</text>`;
}

function nameWidth(value, fontSize) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20000" height="200"><text x="20" y="120" font-family="Be Vietnam Pro" font-weight="500" font-size="${fontSize}">${escapeXml(value)}</text></svg>`;
  const box = new Resvg(svg, measureOptions).getBBox();
  return box?.width ?? 0;
}

// Measure actual glyph outlines, including Vietnamese accents, before choosing
// line breaks. Even a long unbroken name stays within its reserved area.
export function fitGuestName(name) {
  const [clean] = validateGuests([name]);
  for (const fontSize of [64, 56, 48, 40, 34, 28, 24, 20, 18]) {
    const cache = new Map();
    const width = (value) => {
      if (!cache.has(value)) cache.set(value, nameWidth(value, fontSize));
      return cache.get(value);
    };
    const lines = [];
    let line = '';
    for (const word of clean.split(/\s+/u)) {
      const candidate = line ? `${line} ${word}` : word;
      if (width(candidate) <= 810) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      if (width(word) <= 810) { line = word; continue; }
      for (const { segment } of new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(word)) {
        if (line && width(line + segment) > 810) { lines.push(line); line = ''; }
        line += segment;
      }
    }
    if (line) lines.push(line);
    const lineHeight = fontSize * 1.3;
    if (lines.length <= 3 && lines.length * lineHeight <= 105) {
      return { lines, fontSize, lineHeight, widths: lines.map(width) };
    }
  }
  throw new Error('Tên người nhận không vừa vùng tên trên thiệp.');
}

export function cardFilename(name, index = 0) {
  const [clean] = validateGuests([name]);
  const slug = clean.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'guest';
  const hash = createHash('sha256').update(clean).digest('hex').slice(0, 8);
  return `${String(index + 1).padStart(3, '0')}-${slug}-${hash}.png`;
}

export function createPortraitSvg(name, defaultLanguage = 'vi') {
  const language = parseLanguage(defaultLanguage);
  const c = copy[language];
  const fitted = fitGuestName(name);
  const firstBaseline = 298 - (fitted.lines.length - 1) * fitted.lineHeight / 2;
  const nameText = fitted.lines.map((line, index) => text(line, 540, firstBaseline + index * fitted.lineHeight,
    fitted.fontSize, 'font-weight="500"')).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1620" viewBox="0 0 1080 1620" xml:lang="${language}">
  <title>${escapeXml(name)} · Graduation Ceremony</title>
  <defs>${corner}<pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1" fill="#a9c6e6" opacity=".45"/></pattern></defs>
  <rect width="1080" height="1620" fill="#e8f1fb"/><rect width="1080" height="1620" fill="url(#dots)"/>
  <rect x="36" y="38" width="1008" height="1544" fill="white"/>
  <rect x="51" y="53" width="978" height="1514" fill="none" stroke="#89abd9"/>
  <rect x="59" y="61" width="962" height="1498" fill="none" stroke="#d6e4f5"/>
  <g color="#1488d8"><use xlink:href="#i-corner" x="64" y="66" width="62" height="62"/>
  <use xlink:href="#i-corner" x="64" y="66" width="62" height="62" transform="translate(1080 0) scale(-1 1)"/>
  <use xlink:href="#i-corner" x="64" y="66" width="62" height="62" transform="translate(0 1620) scale(1 -1)"/>
  <use xlink:href="#i-corner" x="64" y="66" width="62" height="62" transform="translate(1080 1620) scale(-1 -1)"/></g>
  <g font-family="Be Vietnam Pro" fill="#030391" text-anchor="middle">
  <image xlink:href="${logo}" x="510" y="80" width="60" height="62"/>
  ${text(c.school, 540, 170, 22, 'font-weight="600"')}
  ${text(c.university, 540, 196, 14, 'fill="#596286"')}
  <path d="M318 230h56m332 0h56" stroke="#adc4e2"/>
  ${text(c.dear, 540, 237, 18, 'font-weight="600" letter-spacing="4"')}
  ${nameText}
  ${cap}
  <g font-family="Allura" font-weight="400">
  ${text('Graduation', 530, 458, 155)}
  ${text('Ceremony', 555, 588, 137)}
  </g>
  <g fill="#1488d8" font-size="30"><text x="140" y="495">✧</text><text x="915" y="641">✧</text></g>
  ${text(c.milestone, 540, 687, 36, 'font-family="Cormorant Garamond" font-style="italic" fill="#596286"')}
  ${text(c.message[0], 540, 754, 29, 'fill="#596286"')}
  ${text(c.message[1], 540, 803, 29, 'fill="#202752" font-weight="500"')}
  <g transform="translate(445 846) scale(1.26)" fill="none" stroke="#1488d8" stroke-width=".8"><path d="M4 14h47c17 0 16-11 7-7-9 4 11 20 17 7 6 13 26-3 17-7-9-4-10 7 7 7h47"/><path d="m71 6 4-4 4 4-4 4Z"/></g>
  ${text(c.month, 315, 935, 18, 'letter-spacing="3"')}
  ${text('29', 315, 1038, 108, 'font-family="Cormorant Garamond" font-weight="500"')}
  <path d="M465 913v132" stroke="#c5d5e9"/>
  ${text(c.time, 705, 935, 17, 'letter-spacing="3" fill="#596286"')}
  ${text('10:30 – 11:30', 705, 1001, 49, 'font-family="Cormorant Garamond" font-weight="500"')}
  ${text(c.timezone, 705, 1040, 18, 'fill="#596286"')}
  <path d="M113 1088h854" stroke="#cbdaf0"/>
  ${text(c.location, 540, 1132, 17, 'letter-spacing="3" fill="#596286"')}
  ${text(c.venue, 540, 1192, language === 'en' ? 44 : 48, 'font-family="Cormorant Garamond" font-weight="500"')}
  ${text(c.address[0], 540, 1252, 27, 'fill="#596286"')}
  ${text(c.address[1], 540, 1300, 27, 'fill="#596286"')}
  ${text(c.phone, 540, 1385, 27)}
  ${text(c.closing, 540, 1502, 69, 'font-family="Allura" fill="#1488d8"')}
  </g></svg>`;
}

export function renderPortraitCard(name, language = 'vi') {
  return new Resvg(createPortraitSvg(name, language), fontOptions).render().asPng();
}
