import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('caseTrackerToken');
    if (!token) {
      setLoading(false);
      return;
    }

    http
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('caseTrackerToken'))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const { data } = await http.post('/auth/login', { email, password });
        localStorage.setItem('caseTrackerToken', data.token);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        localStorage.removeItem('caseTrackerToken');
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
