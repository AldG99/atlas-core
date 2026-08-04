export const CONTACT_EMAIL = 'skytla.vault@gmail.com';

export const getLegalLang = (lang: string | undefined): 'es' | 'en' | 'pt' | 'fr' | 'it' => {
  if (lang?.startsWith('en')) return 'en';
  if (lang?.startsWith('pt')) return 'pt';
  if (lang?.startsWith('fr')) return 'fr';
  if (lang?.startsWith('it')) return 'it';
  return 'es';
};
