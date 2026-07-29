import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

export const RouterProvider = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo(
    () => ({
      path,
      navigate: (to, { replace = false } = {}) => {
        if (window.location.pathname === to) return;
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method](null, '', to);
        setPath(to);
      }
    }),
    [path]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useRouter = () => useContext(RouterContext);

export const getCaseIdFromPath = (path) => {
  const match = path.match(/^\/cases\/([^/]+)$/);
  return match?.[1] ?? null;
};
