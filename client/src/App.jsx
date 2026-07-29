import { useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getCaseIdFromPath, useRouter } from './context/RouterContext';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CasesPage } from './pages/CasesPage';
import { LoginPage } from './pages/LoginPage';

export const App = () => {
  const { path, navigate } = useRouter();

  let page = null;
  if (path === '/' || path === '/cases') page = <CasesPage />;
  if (getCaseIdFromPath(path)) page = <CaseDetailPage />;

  useEffect(() => {
    if (!page && path !== '/login') navigate('/cases', { replace: true });
  }, [page, path, navigate]);

  if (path === '/login') return <LoginPage />;

  if (!page) {
    return null;
  }

  return (
    <ProtectedRoute>
      <AppShell>{page}</AppShell>
    </ProtectedRoute>
  );
};
