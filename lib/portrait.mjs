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

export const CARD_TYPES = ['graduation', 'family'];

const copy = {
  graduation: {
    vi: {
      school: 'ĐẠI HỌC BÁCH KHOA', university: 'ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH', dear: 'THÂN MỜI BẠN',
      title: 'Ceremony', milestone: 'Có bạn, ngày này sẽ trọn vẹn hơn.',
      message: ['Đến chung vui trong ngày tốt nghiệp', 'và chụp cùng mình thật nhiều ảnh nhé!'],
      month: 'THÁNG 11', day: '29', time: 'THỜI GIAN', timeValue: '10:30 – 11:30', timezone: 'Theo giờ Việt Nam',
      location: 'ĐỊA ĐIỂM', venue: 'Trường Đại học Bách khoa', address: ['268 Lý Thường Kiệt', 'Phường Diên Hồng, TP. Hồ Chí Minh'],
      phone: 'Điện thoại / Zalo: 0356 378 040', closing: 'Hẹn gặp bạn ở sân trường!',
    },
    en: {
      school: 'HO CHI MINH CITY', university: 'UNIVERSITY OF TECHNOLOGY · VNU-HCM', dear: 'DEAR',
      title: 'Ceremony', milestone: 'This day will be brighter with you there.',
      message: ['Come celebrate my graduation with me', 'and let’s take lots of photos together!'],
      month: 'NOVEMBER', day: '29', time: 'TIME', timeValue: '10:30 – 11:30', timezone: 'Vietnam time · UTC+7',
      location: 'VENUE', venue: 'HCMC University of Technology', address: ['268 Ly Thuong Kiet Street', 'Dien Hong Ward, Ho Chi Minh City'],
      phone: 'Phone / Zalo: 0356 378 040', closing: 'See you on campus!',
    },
  },
  family: {
    vi: {
      school: 'ĐẠI HỌC BÁCH KHOA', university: 'ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH', dear: 'KÍNH GỬI',
      title: 'Celebration', milestone: 'Tiệc mừng tốt nghiệp đại học',
      message: ['Con trân trọng kính mời', 'đến dự buổi tiệc mừng tốt nghiệp.'],
      month: 'THÁNG 11', day: '28', time: 'THỜI GIAN', timeValue: '18:00', timezone: 'Thứ Bảy · năm 2026',
      location: 'ĐỊA ĐIỂM', venue: 'Nhà hàng Sesan', address: ['14 Einstein', 'Thủ Đức, TP. Hồ Chí Minh'],
      phone: 'Điện thoại / Zalo: 0356 378 040', closing: 'Rất mong được đón tiếp.',
    },
    en: {
      school: 'HO CHI MINH CITY', university: 'UNIVERSITY OF TECHNOLOGY · VNU-HCM', dear: 'DEAR',
      title: 'Celebration', milestone: 'A dinner in celebration of my graduation',
      message: ['Hoàng Nam cordially invites you', 'to a graduation celebration dinner.'],
      month: 'NOVEMBER', day: '28', time: 'TIME', timeValue: '6:00 PM', timezone: 'Saturday · 2026',
      location: 'VENUE', venue: 'Sesan Restaurant', address: ['14 Einstein', 'Thủ Đức, Ho Chi Minh City'],
      phone: 'Phone / Zalo: 0356 378 040', closing: 'We look forward to welcoming you.',
    },
  },
};

export function parseCardType(value = 'graduation') {
  const card = String(value).trim().toLowerCase() || 'graduation';
  if (!CARD_TYPES.includes(card)) throw new Error(`Loại thiệp chỉ nhận: ${CARD_TYPES.join(', ')}.`);
  return card;
}

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

export function createPortraitSvg(name, defaultLanguage = 'vi', cardType = 'graduation') {
  const language = parseLanguage(defaultLanguage);
  const card = parseCardType(cardType);
  const c = copy[card][language];
  const fitted = fitGuestName(name);
  const firstBaseline = 298 - (fitted.lines.length - 1) * fitted.lineHeight / 2;
  const nameText = fitted.lines.map((line, index) => text(line, 540, firstBaseline + index * fitted.lineHeight,
    fitted.fontSize, 'font-weight="500"')).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1620" viewBox="0 0 1080 1620" xml:lang="${language}">
  <title>${escapeXml(name)} · Graduation ${c.title}</title>
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
  ${text(c.title, 555, 588, c.title.length > 8 ? 124 : 137)}
  </g>
  <g fill="#1488d8" font-size="30"><text x="140" y="495">✧</text><text x="915" y="641">✧</text></g>
  ${text(c.milestone, 540, 687, 36, 'font-family="Cormorant Garamond" font-style="italic" fill="#596286"')}
  ${text(c.message[0], 540, 754, c.message[0].length > 40 ? 27 : 29, 'fill="#596286"')}
  ${text(c.message[1], 540, 803, 29, 'fill="#202752" font-weight="500"')}
  <g transform="translate(445 846) scale(1.26)" fill="none" stroke="#1488d8" stroke-width=".8"><path d="M4 14h47c17 0 16-11 7-7-9 4 11 20 17 7 6 13 26-3 17-7-9-4-10 7 7 7h47"/><path d="m71 6 4-4 4 4-4 4Z"/></g>
  ${text(c.month, 315, 935, 18, 'letter-spacing="3"')}
  ${text(c.day, 315, 1038, 108, 'font-family="Cormorant Garamond" font-weight="500"')}
  <path d="M465 913v132" stroke="#c5d5e9"/>
  ${text(c.time, 705, 935, 17, 'letter-spacing="3" fill="#596286"')}
  ${text(c.timeValue, 705, 1001, c.timeValue.length > 6 ? 49 : 58, 'font-family="Cormorant Garamond" font-weight="500"')}
  ${text(c.timezone, 705, 1040, 18, 'fill="#596286"')}
  <path d="M113 1088h854" stroke="#cbdaf0"/>
  ${text(c.location, 540, 1132, 17, 'letter-spacing="3" fill="#596286"')}
  ${text(c.venue, 540, 1192, c.venue.length > 26 ? 44 : 48, 'font-family="Cormorant Garamond" font-weight="500"')}
  ${text(c.address[0], 540, 1252, 27, 'fill="#596286"')}
  ${text(c.address[1], 540, 1300, 27, 'fill="#596286"')}
  ${text(c.phone, 540, 1385, 27)}
  ${text(c.closing, 540, 1502, c.closing.length > 26 ? 60 : 69, 'font-family="Allura" fill="#1488d8"')}
  </g></svg>`;
}

export function renderPortraitCard(name, language = 'vi', cardType = 'graduation') {
  return new Resvg(createPortraitSvg(name, language, cardType), fontOptions).render().asPng();
}

// Ảnh 1200 × 630 cho Open Graph của thiệp gia đình; không chứa tên người nhận.
export function createFamilyPreviewSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" xml:lang="vi">
  <defs>${corner}</defs>
  <rect width="1200" height="630" fill="#e8f1fb"/>
  <rect x="28" y="28" width="1144" height="574" fill="white"/>
  <rect x="42" y="42" width="1116" height="546" fill="none" stroke="#89abd9"/>
  <rect x="50" y="50" width="1100" height="530" fill="none" stroke="#d6e4f5"/>
  <g color="#1488d8"><use xlink:href="#i-corner" x="56" y="56" width="52" height="52"/>
  <use xlink:href="#i-corner" x="56" y="56" width="52" height="52" transform="translate(1200 0) scale(-1 1)"/>
  <use xlink:href="#i-corner" x="56" y="56" width="52" height="52" transform="translate(0 630) scale(1 -1)"/>
  <use xlink:href="#i-corner" x="56" y="56" width="52" height="52" transform="translate(1200 630) scale(-1 -1)"/></g>
  <g font-family="Be Vietnam Pro" fill="#030391" text-anchor="middle">
  <image xlink:href="${logo}" x="575" y="72" width="50" height="52"/>
  <path d="M372 160h60m336 0h60" stroke="#adc4e2"/>
  ${text('TRÂN TRỌNG KÍNH MỜI', 600, 166, 17, 'font-weight="600" letter-spacing="3"')}
  <g font-family="Allura" font-weight="400">
  ${text('Graduation Celebration', 600, 280, 104)}
  </g>
  ${text('Tiệc mừng tốt nghiệp của con', 600, 345, 32, 'font-family="Cormorant Garamond" font-style="italic" fill="#596286"')}
  <path d="M260 395h680" stroke="#cbdaf0"/>
  ${text('18:00 · Thứ Bảy, 28 tháng 11', 600, 455, 40, 'font-family="Cormorant Garamond" font-weight="500"')}
  ${text('Nhà hàng Sesan · 14 Einstein, Thủ Đức', 600, 510, 27, 'fill="#596286"')}
  </g></svg>`;
}

export function renderFamilyPreview() {
  return new Resvg(createFamilyPreviewSvg(), fontOptions).render().asPng();
}
