import i18n, { type BackendModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// en-US va empaquetado de forma síncrona porque es el fallback final de
// toda la cadena (ver `fallbackLng.default` abajo) y porque hay llamadas a
// i18n.t() fuera de React (orderService.ts, planLimits.ts) que no pueden
// esperar una carga async. El resto de idiomas se descarga solo cuando se
// activan (detectado o elegido por el usuario).
import enUS from './locales/en-US.json';

const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  'es-419': () => import('./locales/es-419.json'),
  'es-ES': () => import('./locales/es-ES.json'),
  'en-GB': () => import('./locales/en-GB.json'),
  pt: () => import('./locales/pt.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
  de: () => import('./locales/de.json'),
};

const lazyBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language, _namespace, callback) => {
    const loader = localeLoaders[language];
    if (!loader) {
      callback(new Error(`Unsupported language: ${language}`), null);
      return;
    }
    loader()
      .then((mod) => callback(null, mod.default))
      .catch((err) => callback(err, null));
  },
};

const updateMetaDescription = () => {
  const description = i18n.t('auth.tagline');
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
};

i18n
  .use(lazyBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
    },
    // Sin esto, i18next asume que `resources` ya cubre todo y NUNCA llama
    // al backend para el resto de idiomas (ver i18next#loadResources).
    partialBundledLanguages: true,
    fallbackLng: {
      'es-ES': ['es-419', 'en-US'],
      'en-GB': ['en-US'],
      default: ['en-US'],
    },
    supportedLngs: ['es-419', 'es-ES', 'en-US', 'en-GB', 'pt', 'fr', 'it', 'de'],
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
