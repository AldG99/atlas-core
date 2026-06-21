export const CONTACT_EMAIL = 'skytla.vault@gmail.com';

export const getLegalLang = (lang: string | undefined): 'es' | 'en' | 'pt' | 'fr' => {
  if (lang?.startsWith('en')) return 'en';
  if (lang?.startsWith('pt')) return 'pt';
  if (lang?.startsWith('fr')) return 'fr';
  return 'es';
};
