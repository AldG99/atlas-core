import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esLatam from './locales/es-419.json';
import esSpain from './locales/es-ES.json';
import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

const updateMetaDescription = () => {
  const description = i18n.t('auth.tagline');
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'es-419': { translation: esLatam },
      'es-ES': { translation: esSpain },
      'en-US': { translation: enUS },
      'en-GB': { translation: enGB },
      pt: { translation: pt },
      fr: { translation: fr },
      it: { translation: it },
    },
    fallbackLng: {
      'es-ES': ['es-419', 'en-US'],
      'en-GB': ['en-US'],
      default: ['en-US'],
    },
    supportedLngs: ['es-419', 'es-ES', 'en-US', 'en-GB', 'pt', 'fr', 'it'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'skytla_lang',
      // El navegador reporta variantes como 'es', 'es-MX', 'en', 'en-AU'...
      // Todo lo que empiece con "es"/"en" y no sea explícitamente
      // España/UK se enruta a la variante latina/US respectivamente.
      convertDetectedLanguage: (lng: string) => {
        const lower = lng.toLowerCase();
        if (lower.startsWith('es')) return lower === 'es-es' ? 'es-ES' : 'es-419';
        if (lower.startsWith('en')) return lower === 'en-gb' ? 'en-GB' : 'en-US';
        return lng;
      },
    },
  })
  .then(updateMetaDescription);

i18n.on('languageChanged', updateMetaDescription);

export default i18n;
