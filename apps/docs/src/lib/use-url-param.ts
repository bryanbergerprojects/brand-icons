import { useEffect, useState } from 'react';

/**
 * Reads and writes a single URL search-param, kept in sync via `history.replaceState`.
 *
 * SSR-safe: the initial render returns the `initial` value, then the effect
 * hydrates from `window.location.search`. Subsequent updates patch the URL
 * without triggering a navigation.
 * @param key search-param name
 * @param initial value used during SSR and before hydration
 * @returns `[value, setValue]` tuple — passing an empty string drops the key
 */
export const useUrlParam = (key: string, initial = ''): readonly [string, (next: string) => void] => {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key) ?? initial);
  }, [key, initial]);

  const update = (next: string): void => {
    setValue(next);
    const params = new URLSearchParams(window.location.search);
    if (next === '') {
      params.delete(key);
    } else {
      params.set(key, next);
    }
    const search = params.toString();
    const target = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', target);
  };

  return [value, update] as const;
};
