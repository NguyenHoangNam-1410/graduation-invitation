export const DEFAULT_PREVIEW_VERSION = '6';

export function parseGuestNames(value = '') {
  const input = value.trim();
  if (!input) return [];
  let plain = input;
  if (input.startsWith('[')) {
    let parsed;
    let validJson = false;
    try {
      parsed = JSON.parse(input);
      validJson = true;
    } catch { /* A bracketed, unquoted list is also accepted below. */ }
    if (validJson) return validateGuests(parsed);
    if (!input.endsWith(']')) {
      throw new Error('GUEST_NAMES thiếu dấu ]. Hoặc bỏ dấu ngoặc và nhập tên cách nhau bằng dấu phẩy.');
    }
    plain = input.slice(1, -1).trim();
  }
  if (/["{}\[\]]/u.test(plain)) {
    throw new Error('GUEST_NAMES chưa đúng định dạng. Dùng: Bạn A, Bạn B; hoặc JSON: ["Bạn A", "Bạn B"].');
  }
  return validateGuests(plain.split(/[,\r\n]+/u).map((name) => name.trim()).filter(Boolean));
}

export function validateGuests(value) {
  if (!Array.isArray(value)) throw new Error('GUEST_NAMES phải là một mảng JSON chứa tên người nhận.');
  const names = value.map((name) => {
    if (typeof name !== 'string') throw new Error('Mỗi người nhận phải là một chuỗi tên.');
    const clean = name.normalize('NFC').trim();
    if (!clean || [...clean].length > 120 || /[\u0000-\u001f\u007f]/u.test(clean)) {
      throw new Error('Tên phải dài 1–120 ký tự và không chứa ký tự xuống dòng/điều khiển.');
    }
    return clean;
  });
  return [...new Set(names)];
}

export function buildInvitationLinks(siteUrl, guests, previewVersion = DEFAULT_PREVIEW_VERSION) {
  const version = String(previewVersion).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(version)) {
    throw new Error('PREVIEW_VERSION phải là số hoặc chữ, có thể dùng dấu chấm, gạch ngang hoặc gạch dưới.');
  }
  const base = new URL(siteUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && local)) {
    throw new Error('SITE_URL phải dùng HTTPS (hoặc HTTP trên localhost để xem thử).');
  }
  if (base.username || base.password) throw new Error('SITE_URL không được chứa thông tin đăng nhập.');
  base.search = '';
  base.hash = '';
  return validateGuests(guests).map((name) => {
    const url = new URL(base);
    url.searchParams.set('to', name);
    url.searchParams.set('v', version);
    return { name, url: url.href };
  });
}
