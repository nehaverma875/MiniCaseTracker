import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/LockOutlined';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage, useLoginMutation } from '../api/apiSlice';
import { setCredentials } from '../features/auth/authSlice';

export const LoginPage = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: 'manager@test.com', password: 'password' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await login(form).unwrap();
      dispatch(setCredentials(data));
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <LockIcon />
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800}>
                Mini Case Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue
              </Typography>
            </Box>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            <Stack component="form" spacing={2} onSubmit={submit} sx={{ width: '100%' }}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                fullWidth
              />
              <Button type="submit" size="large" variant="contained" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Stack>
            <Box sx={{ width: '100%', bgcolor: '#f1f5f9', borderRadius: 1, p: 1.5 }}>
              <Typography variant="caption" display="block" color="text.secondary">
                Manager: manager@test.com / password
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Agent: agent@test.com / password
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
