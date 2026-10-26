import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../utils/translations.js';

const LanguageContext = createContext(null);
const allowedLanguages = ['en', 'ja', 'id'];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = window.localStorage.getItem('kuro-neko-language');
      return allowedLanguages.includes(savedLanguage) ? savedLanguage : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('language-ja', language === 'ja');
    try {
      window.localStorage.setItem('kuro-neko-language', language);
    } catch {
      // The selected language still applies until this page is closed.
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: (text, values) => translate(text, language, values) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider.');
  return context;
}

export function LanguageSelect({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  return <label className={`language-select ${className}`}>
    <span className="visually-hidden">Language</span>
    <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
      <option value="en">EN</option>
      <option value="ja">日本語</option>
      <option value="id">ID</option>
    </select>
  </label>;
}
