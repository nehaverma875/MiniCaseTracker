import { LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '../api/http';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Alert, Button, Card, CardContent, Input } from '../components/ui';

export const LoginPage = () => {
  const { user, login } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState({ email: 'manager@example.com', password: 'Password123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/cases', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/cases');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Mini Case Tracker</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
            </div>
            {error && <Alert variant="error" className="w-full">{error}</Alert>}
            <form className="grid w-full gap-4" onSubmit={submit}>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </label>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <div className="grid w-full gap-1 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
              <span>Manager: manager@example.com / Password123!</span>
              <span>Agent: agent@example.com / Password123!</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};
