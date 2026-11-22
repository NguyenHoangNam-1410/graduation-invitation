import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseGuestNames, parseLanguage, DEFAULT_PREVIEW_VERSION } from '../lib/invitations.mjs';
import { generateInvitations } from '../lib/generate-invitations.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));

try {
  if (existsSync(envPath)) loadEnvFile(envPath);
  if (!process.env.SITE_URL) throw new Error('Hãy sao chép .env.example thành .env.local và điền SITE_URL.');
  const suppliedNames = process.argv.slice(2);
  const guests = suppliedNames.length ? suppliedNames : parseGuestNames(process.env.GUEST_NAMES || '');
  const previewVersion = process.env.PREVIEW_VERSION?.trim() || DEFAULT_PREVIEW_VERSION;
  const language = parseLanguage(process.env.DEFAULT_LANGUAGE);
  const links = await generateInvitations({ siteUrl: process.env.SITE_URL, guests, previewVersion,
    defaultLanguage: language, destination: fileURLToPath(new URL('../private/', import.meta.url)) });
  console.log(`Đã tạo ${links.length} ảnh thiệp 1080 × 1620 và link trong ${root}private/`);
  console.log(`Ngôn ngữ ảnh và link: ${language.toUpperCase()}`);
  console.log(`Phiên bản preview: v=${previewVersion}`);
  if (!links.length) console.log('Chưa có người nhận. Điền GUEST_NAMES trong .env.local rồi chạy lại npm run links.');
  console.log('Danh sách tên và link nằm ở local, được loại khỏi Git.');
} catch (error) {
  console.error(`Không thể tạo thiệp và link: ${error.message}`);
  process.exitCode = 1;
}
