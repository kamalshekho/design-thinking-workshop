import { type ReactNode, useEffect, useState } from 'react';

import { de } from './de';
import { en } from './en';
import { LocaleContext } from './LocaleContext';
import type { Content, Locale } from './types';

const STORAGE_KEY = 'ichbinhier.locale.v1';
const contentByLocale: Record<Locale, Content> = { de, en };

function storedLocale(): Locale {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'de';
  } catch {
    return 'de';
  }
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(storedLocale);
  const content = contentByLocale[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // A private browsing mode may reject storage; the current session still works.
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, content, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
