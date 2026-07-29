import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '../api/apiSlice';
import { logout, setUser } from '../features/auth/authSlice';

export const ProtectedRoute = ({ children, role }) => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (data?.user) dispatch(setUser(data.user));
    if (error) dispatch(logout());
  }, [data, dispatch, error]);

  if (token && (isLoading || !user)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};
