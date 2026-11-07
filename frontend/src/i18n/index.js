import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import kmTranslation from './locales/km/translation.json';

// Supported language codes: 'en' | 'km'
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('edumanage_lang');
    if (saved === 'en' || saved === 'km') return saved;
  }
  return 'en';
};

const initialLang = getStoredLanguage();

export const applyDocumentLanguage = (lang) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'km' ? 'km-KH' : 'en-US';
    document.documentElement.setAttribute('data-lang', lang);
    if (document.body) {
      document.body.setAttribute('data-lang', lang);
      if (lang === 'km') {
        document.body.classList.remove('lang-en');
        document.body.classList.add('lang-km');
      } else {
        document.body.classList.remove('lang-km');
        document.body.classList.add('lang-en');
      }
    }
    localStorage.setItem('edumanage_lang', lang);
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      km: { translation: kmTranslation }
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

// Apply document language immediately on module load
applyDocumentLanguage(initialLang);

i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng);
});

export default i18n;

