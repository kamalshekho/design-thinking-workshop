import { describe, expect, it } from 'vitest';

import { de } from './de';
import { errorMessage } from './errorMessage';

describe('errorMessage', () => {
  it('words a code the contract names', () => {
    expect(errorMessage('RATE_LIMITED')).toBe(de.errors.codes.RATE_LIMITED);
    expect(errorMessage('NOT_DISCARDED')).toBe(de.errors.codes.NOT_DISCARDED);
  });

  it('falls back to the general wording for a code it does not know', () => {
    expect(errorMessage('METHOD_NOT_ALLOWED')).toBe(de.errors.general);
    expect(errorMessage(undefined)).toBe(de.errors.general);
  });

  it('does not answer a top-level code with a field wording', () => {
    expect(errorMessage('CATEGORY_NAME_TAKEN')).toBe(de.errors.general);
  });
});

describe('field wordings', () => {
  it('count the length limits from the constants the inputs use', () => {
    expect(de.errors.fields.NOTES_TOO_LONG).toContain('4000');
    expect(de.errors.fields.CATEGORY_NAME_TOO_LONG).toContain('60');
    expect(de.errors.fields.CATEGORY_DESCRIPTION_TOO_LONG).toContain('140');
  });
});
