import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildInvitationLinks, parseLanguage, DEFAULT_PREVIEW_VERSION } from './invitations.mjs';
import { cardFilename, renderPortraitCard } from './portrait.mjs';

export async function generateInvitations({ siteUrl, guests, previewVersion = DEFAULT_PREVIEW_VERSION,
  defaultLanguage = 'vi', destination }) {
  const language = parseLanguage(defaultLanguage);
  const links = buildInvitationLinks(siteUrl, guests, previewVersion, language);
  await mkdir(join(destination, 'cards', language), { recursive: true });
  const invitations = [];
  for (const [index, link] of links.entries()) {
    const image = `cards/${language}/${cardFilename(link.name, index)}`;
    await writeFile(join(destination, image), renderPortraitCard(link.name, language));
    invitations.push({ ...link, language, image });
  }
  // Write the manifests after all images succeed so each listed image exists.
  await writeFile(join(destination, 'invitation-links.json'), JSON.stringify(invitations, null, 2) + '\n');
  await writeFile(join(destination, 'invitation-links.txt'), invitations.map(({ name, url, image }) =>
    `${name}\nẢnh: ${image}\n${url}`).join('\n\n') + (invitations.length ? '\n' : ''));
  return invitations;
}
