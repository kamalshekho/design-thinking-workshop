import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  patchCategory,
  putCategoryOrder,
} from './categories';
import { ApiProblem } from './problem';

function answer(body: unknown, status = 200) {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
    () =>
      Promise.resolve(
        status === 204
          ? new Response(null, { status })
          : new Response(JSON.stringify(body), {
              status,
              headers: { 'Content-Type': 'application/json' },
            }),
      ),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

const wire = {
  id: '5c2b0000-0000-0000-0000-000000000000',
  name: 'Social Media',
  description: 'Kommentare moderieren.',
  active: true,
};

describe('the Category writes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the list out of its envelope', async () => {
    const mock = answer({ categories: [wire] });

    await expect(fetchCategories()).resolves.toEqual([wire]);
    expect(mock.mock.calls[0]?.[0]).toBe('/api/v1/staff/categories');
  });

  /** The id is the server's; a create sends the draft and takes one back. */
  it('posts a draft and keeps the id the server minted', async () => {
    const mock = answer({ ...wire, id: 'minted-by-the-server' }, 201);
    const draft = { name: 'Fundraising', description: '', active: true };

    await expect(createCategory(draft)).resolves.toMatchObject({
      id: 'minted-by-the-server',
    });

    const [path, init] = mock.mock.calls[0] ?? [];
    expect(path).toBe('/api/v1/staff/categories');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(draft));
  });

  it('patches only the fields the change names', async () => {
    const mock = answer({ ...wire, active: false });

    await patchCategory(wire.id, { active: false });

    const [path, init] = mock.mock.calls[0] ?? [];
    expect(path).toBe(`/api/v1/staff/categories/${wire.id}`);
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe('{"active":false}');
  });

  it('deletes by id and answers nothing', async () => {
    const mock = answer(null, 204);

    await expect(deleteCategory(wire.id)).resolves.toBeUndefined();
    expect(mock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });

  /**
   * `409 CATEGORY_IN_USE` is the answer Kategorien's disabled delete button
   * also guards against, and the wording tells the Staff member to deactivate
   * instead (`A15`). It has to arrive as a code, not as a rejected promise
   * with nothing on it.
   */
  it('throws the in-use code rather than a bare failure', async () => {
    answer({ status: 409, code: 'CATEGORY_IN_USE' }, 409);

    await expect(deleteCategory(wire.id)).rejects.toBeInstanceOf(ApiProblem);
    await expect(deleteCategory(wire.id)).rejects.toMatchObject({
      code: 'CATEGORY_IN_USE',
    });
  });

  /** The whole order, as ids, and the reordered list back (`API.md`). */
  it('puts the order as ids and takes the list back', async () => {
    const second = { ...wire, id: 'a1f0', name: 'Rechtliches' };
    const mock = answer({ categories: [second, wire] });

    await expect(putCategoryOrder([second.id, wire.id])).resolves.toEqual([
      second,
      wire,
    ]);

    const [path, init] = mock.mock.calls[0] ?? [];
    expect(path).toBe('/api/v1/staff/categories/order');
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ ids: [second.id, wire.id] }));
  });
});
