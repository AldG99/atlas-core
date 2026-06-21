export const MIEMBRO_EMAIL_DOMAIN = 'skytla.miembro';

export const makeMiembroEmail = (username: string) =>
  `${username}@${MIEMBRO_EMAIL_DOMAIN}`;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generarUsername = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
};
