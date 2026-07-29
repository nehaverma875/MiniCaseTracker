import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../features/auth/authSlice';
import { useGetMeQuery } from '../features/auth/authApi';
import { Spinner } from './ui';

export const ProtectedRoute = ({ children, role }) => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const shouldLoadUser = Boolean(token && !user);
  const { data, error, isLoading } = useGetMeQuery(undefined, { skip: !shouldLoadUser });

  useEffect(() => {
    if (data?.user) dispatch(setUser(data.user));
    if (error) dispatch(logout());
  }, [data, dispatch, error]);

  if (token && !user && isLoading) {
    return (
      <div className="page-shell" style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};
