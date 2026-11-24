import { describe, expect, it } from 'vitest';

import { cx } from './cx';

describe('cx', () => {
  it('keeps text color when merged with custom font-size tokens', () => {
    expect(cx('text-sd-muted-foreground', 'text-2xs')).toBe(
      'text-sd-muted-foreground text-2xs',
    );
    expect(cx('text-tertiary', 'text-caption')).toBe(
      'text-tertiary text-caption',
    );
    expect(cx('text-secondary', 'text-body-sm')).toBe(
      'text-secondary text-body-sm',
    );
  });

  it('resolves conflicting font-size classes with custom tokens', () => {
    expect(cx('text-sm', 'text-body-sm')).toBe('text-body-sm');
    expect(cx('text-2xs', 'text-xs')).toBe('text-xs');
  });

  it('keeps ring and outline colors when merged with hairline widths', () => {
    expect(cx('ring-secondary', 'ring-hairline')).toBe(
      'ring-secondary ring-hairline',
    );
    expect(cx('ring-hairline', 'ring-1')).toBe('ring-1');
    expect(cx('outline-border-secondary', 'outline-hairline')).toBe(
      'outline-border-secondary outline-hairline',
    );
    expect(cx('rounded-inner', 'rounded-full')).toBe('rounded-full');
  });
});
