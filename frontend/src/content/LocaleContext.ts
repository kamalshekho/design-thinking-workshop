import { createContext } from 'react';

import { de } from './de';
import type { Content, Locale } from './types';

export interface LocaleContextValue {
  locale: Locale;
  content: Content;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'de',
  content: de,
  setLocale: () => undefined,
});
