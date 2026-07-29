import { BriefcaseBusiness, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from './ui';

export const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);

  const actions = (
    <div className="flex flex-col gap-2 md:flex-row">
      <Button variant="ghost" onClick={() => navigate('/cases')}>
        <BriefcaseBusiness className="h-4 w-4" />
        Cases
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="h-9 w-9 p-0 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">M</div>
            <div>
              <div className="text-base font-semibold leading-none">
                Mini Case Tracker
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {user?.name} / {user?.role}
              </div>
            </div>
          </div>
          <div className="hidden md:block">{actions}</div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/40" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="font-semibold">Mini Case Tracker</div>
                <div className="mt-1 text-sm text-slate-500">{user?.email}</div>
              </div>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="border-t border-slate-200 pt-4">{actions}</div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
