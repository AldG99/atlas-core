export const MEMBER_EMAIL_DOMAIN = 'skytla.member';

export const makeMemberEmail = (username: string) =>
  `${username}@${MEMBER_EMAIL_DOMAIN}`;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateUsername = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
};
