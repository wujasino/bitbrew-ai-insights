import { useEffect } from 'react';

/**
 * Forces the `.dark` class while mounted and restores prior state on unmount.
 * Used by the landing page to guarantee its neon dark theme regardless of
 * the visitor's stored/system theme preference.
 */
export function useForceDarkTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => {
      if (!hadDark) root.classList.remove('dark');
    };
  }, []);
}
