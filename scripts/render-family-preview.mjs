import { writeFile } from 'node:fs/promises';
import { renderFamilyPreview } from '../lib/portrait.mjs';

const target = new URL('../docs/assets/family-preview-vi.png', import.meta.url);
await writeFile(target, renderFamilyPreview());
console.log('Đã tạo docs/assets/family-preview-vi.png (1200 × 630).');
