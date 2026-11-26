import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseGuestNames, parseLanguage, DEFAULT_PREVIEW_VERSION } from '../lib/invitations.mjs';
import { generateInvitations } from '../lib/generate-invitations.mjs';
import { parseCardType } from '../lib/portrait.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));

try {
  if (existsSync(envPath)) loadEnvFile(envPath);
  const args = process.argv.slice(2);
  const cardArg = args.find((arg) => arg.startsWith('--card='));
  const card = parseCardType(cardArg ? cardArg.slice('--card='.length) : 'graduation');
  const family = card === 'family';
  if (!process.env.SITE_URL) throw new Error('Hãy sao chép .env.example thành .env.local và điền SITE_URL.');
  // Thiệp gia đình nằm ở thư mục family/ của cùng trang, dùng danh sách tên riêng.
  const siteUrl = family ? (process.env.FAMILY_SITE_URL?.trim() || new URL('family/', process.env.SITE_URL).href)
    : process.env.SITE_URL;
  const suppliedNames = args.filter((arg) => !arg.startsWith('--card='));
  const guests = suppliedNames.length ? suppliedNames
    : parseGuestNames(process.env[family ? 'FAMILY_GUEST_NAMES' : 'GUEST_NAMES'] || '');
  const previewVersion = process.env.PREVIEW_VERSION?.trim() || DEFAULT_PREVIEW_VERSION;
  const language = parseLanguage(process.env.DEFAULT_LANGUAGE);
  const folder = family ? 'private/family/' : 'private/';
  const links = await generateInvitations({ siteUrl, guests, previewVersion, defaultLanguage: language,
    cardType: card, destination: fileURLToPath(new URL(`../${folder}`, import.meta.url)) });
  console.log(`Thiệp: ${family ? 'tiệc mừng gia đình' : 'lễ tốt nghiệp'}`);
  console.log(`Đã tạo ${links.length} ảnh thiệp 1080 × 1620 và link trong ${root}${folder}`);
  console.log(`Ngôn ngữ ảnh và link: ${language.toUpperCase()}`);
  console.log(`Phiên bản preview: v=${previewVersion}`);
  if (!links.length) {
    console.log(`Chưa có người nhận. Điền ${family ? 'FAMILY_GUEST_NAMES' : 'GUEST_NAMES'} trong .env.local rồi chạy lại.`);
  }
  console.log('Danh sách tên và link nằm ở local, được loại khỏi Git.');
} catch (error) {
  console.error(`Không thể tạo thiệp và link: ${error.message}`);
  process.exitCode = 1;
}
