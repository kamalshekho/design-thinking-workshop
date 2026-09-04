import { useCallback, useEffect, useRef, useState } from 'react';

import { type Category, fetchCategories } from './api';

type CategoriesState =
  | { status: 'loading'; categories: Category[] }
  | { status: 'loaded'; categories: Category[] }
  | { status: 'error'; categories: Category[] };

/**
 * Loads the category list once when the form opens (see API.md) and exposes
 * a `retry` for both the manual retry button and a `CATEGORY_UNAVAILABLE`
 * response, which must reload the list rather than trust the stale one.
 *
 * Each load aborts whatever request came before it, so a superseded fetch
 * (StrictMode's double mount in dev, an unmount mid-flight, or a retry fired
 * while the previous request is still in flight) never lands in state.
 */
export function useCategories() {
  const [state, setState] = useState<CategoriesState>({
    status: 'loading',
    categories: [],
  });
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    void fetchCategories(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setState(
        result.status === 'success'
          ? { status: 'loaded', categories: result.categories }
          : { status: 'error', categories: [] },
      );
    });
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const retry = useCallback(() => {
    setState({ status: 'loading', categories: [] });
    load();
  }, [load]);

  return { ...state, retry };
}
