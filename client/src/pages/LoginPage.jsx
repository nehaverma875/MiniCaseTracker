import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/errorUtils';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { Alert, Button, Card, CardContent, Field, Input } from '../components/ui';

export const LoginPage = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
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
    <div className="page-shell" style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
      <Card style={{ width: 'min(420px, 100%)' }}>
        <CardContent className="stack" style={{ padding: '32px' }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
            <div className="icon-tile" style={{ borderRadius: 999, background: 'var(--primary)', color: 'white' }}>
              <LockKeyhole size={24} />
            </div>
            <div>
              <h1 className="card-title" style={{ fontSize: 24 }}>
                Mini Case Tracker
              </h1>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Sign in to continue
              </p>
            </div>
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <form className="stack" onSubmit={submit}>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
