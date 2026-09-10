import { useContext } from 'react';

import { LocaleContext, type LocaleContextValue } from './LocaleContext';

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
