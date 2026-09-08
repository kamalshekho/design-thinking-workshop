import { describe, expect, it } from 'vitest';

import { FIELD_ERROR_CODES, TOP_LEVEL_ERROR_CODES } from '@/domain/apiError';

import { de } from './de';
import { errorMessage, fieldErrorMessage } from './errorMessage';

describe('errorMessage', () => {
  it('words every code the contract names', () => {
    for (const code of TOP_LEVEL_ERROR_CODES) {
      expect(errorMessage(code)).toBe(de.errors.codes[code]);
    }
  });

  it('falls back to the general wording for a code it does not know', () => {
    expect(errorMessage('METHOD_NOT_ALLOWED')).toBe(de.errors.general);
    expect(errorMessage(undefined)).toBe(de.errors.general);
  });

  it('does not answer a top-level code with a field wording', () => {
    expect(errorMessage('CATEGORY_NAME_TAKEN')).toBe(de.errors.general);
  });
});

describe('fieldErrorMessage', () => {
  it('words every field code the contract names', () => {
    for (const code of FIELD_ERROR_CODES) {
      expect(fieldErrorMessage(code)).toBe(de.errors.fields[code]);
    }
  });

  it('falls back to the general wording for a code it does not know', () => {
    expect(fieldErrorMessage('WHAT_IS_THIS')).toBe(de.errors.general);
    expect(fieldErrorMessage(undefined)).toBe(de.errors.general);
  });

  it('counts the length limits from the constants the inputs use', () => {
    expect(fieldErrorMessage('NOTES_TOO_LONG')).toContain('4000');
    expect(fieldErrorMessage('CATEGORY_NAME_TOO_LONG')).toContain('60');
    expect(fieldErrorMessage('CATEGORY_DESCRIPTION_TOO_LONG')).toContain('140');
  });
});
