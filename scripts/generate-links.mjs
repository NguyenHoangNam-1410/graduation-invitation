import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildInvitationLinks, parseGuestNames, DEFAULT_PREVIEW_VERSION } from '../lib/invitations.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));

try {
  if (existsSync(envPath)) loadEnvFile(envPath);
  if (!process.env.SITE_URL) throw new Error('Hãy sao chép .env.example thành .env.local và điền SITE_URL.');
  const suppliedNames = process.argv.slice(2);
  const guests = suppliedNames.length ? suppliedNames : parseGuestNames(process.env.GUEST_NAMES || '');
  const previewVersion = process.env.PREVIEW_VERSION?.trim() || DEFAULT_PREVIEW_VERSION;
  const links = buildInvitationLinks(process.env.SITE_URL, guests, previewVersion);
  const destination = new URL('../private/', import.meta.url);
  await mkdir(destination, { recursive: true });
  await writeFile(new URL('invitation-links.json', destination), JSON.stringify(links, null, 2) + '\n');
  await writeFile(new URL('invitation-links.txt', destination), links.map(({ name, url }) => `${name}\n${url}`).join('\n\n') + (links.length ? '\n' : ''));
  console.log(`Đã tạo ${links.length} link trong ${root}private/`);
  console.log(`Phiên bản preview: v=${previewVersion}`);
  if (!links.length) console.log('Chưa có người nhận. Điền GUEST_NAMES trong .env.local rồi chạy lại npm run links.');
  console.log('Danh sách tên và link nằm ở local, được loại khỏi Git.');
} catch (error) {
  console.error(`Không thể tạo link: ${error.message}`);
  process.exitCode = 1;
}
