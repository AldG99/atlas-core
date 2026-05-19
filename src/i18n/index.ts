import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';

const updateMetaDescription = () => {
  const description = i18n.t('auth.tagline');
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: ['es', 'en', 'pt', 'fr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'skytla_lang',
    },
  })
  .then(updateMetaDescription);

i18n.on('languageChanged', updateMetaDescription);

export default i18n;
