import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../mocks/server';
import { fetchCategories } from './api';

describe('fetchCategories', () => {
  it('fails to load when a category id is not shaped like a UUID', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [{ id: 'not-a-uuid', label: 'Social Media' }],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('fails to load when a category label is empty after trimming', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            { id: '11111111-1111-4111-8111-111111111111', label: '   ' },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('fails to load when a category label exceeds 120 characters after trimming', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: `  ${'a'.repeat(121)}  `,
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('accepts a category label that is exactly 120 characters after trimming', async () => {
    const label = 'a'.repeat(120);
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: `  ${label}  `,
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({
      status: 'success',
      categories: [{ id: '11111111-1111-4111-8111-111111111111', label }],
    });
  });

  it('fails to load when two categories share an id, regardless of letter case', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: 'Social Media',
            },
            {
              id: '11111111-1111-4111-8111-111111111111'.toUpperCase(),
              label: 'Redaktion',
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('trims surrounding whitespace from an otherwise valid label', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: '  Social Media  ',
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({
      status: 'success',
      categories: [
        { id: '11111111-1111-4111-8111-111111111111', label: 'Social Media' },
      ],
    });
  });

  it('warns with the reason when it rejects a malformed category', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [{ id: 'not-a-uuid', label: 'Social Media' }],
        }),
      ),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await fetchCategories();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-uuid'));
    warn.mockRestore();
  });
});
