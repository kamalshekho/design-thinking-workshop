import { describe, expect, it } from 'vitest';

import { isUuid } from './uuid';

describe('isUuid', () => {
  it('accepts a well-formed UUID', () => {
    expect(isUuid('a3f1c0de-4cde-4d61-830b-4af475f5727b')).toBe(true);
  });

  it('rejects a string that is not shaped like a UUID', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
  });

  it('accepts a UUID regardless of letter case', () => {
    expect(isUuid('A3F1C0DE-4CDE-4D61-830B-4AF475F5727B')).toBe(true);
  });
});
